import { and, asc, desc, eq, inArray, isNotNull, lte, or, sql } from 'drizzle-orm';

import { db, type Tx } from '@/db/drizzle';
import {
  companies,
  employees,
  entitlementRules,
  hrEvents,
  seatAssignments,
  type Employee,
  type HrEvent,
  type HrEventStatus,
} from '@/db/schema';
import { sha256 } from '@/lib/crypto';
import { lossReasonForEmployee } from '@/lib/domain/eligibility';
import {
  canonicalJson,
  isStale,
  MAX_ATTEMPTS,
  nextAttemptAt,
  nextEmployeeState,
  normalizedPayload,
  type HrEventInput,
} from '@/lib/domain/hr-events';
import { DomainError } from '@/lib/errors';
import { logger } from '@/lib/logger';

import { audit, type Actor } from './audit';
import { onEmployeeHired } from './invitations';
import { recomputePool } from './pools';

export type IngestContext = {
  companyId: string;
  source: 'api' | 'ui';
  apiKeyId?: string;
  userId?: string;
};

export type IngestResult = { status: 'accepted' | 'duplicate'; id: string; eventId: string };

export async function ingestEvent(context: IngestContext, event: HrEventInput): Promise<IngestResult> {
  const payload = normalizedPayload(event);
  const payloadHash = sha256(canonicalJson(payload));

  const [inserted] = await db
    .insert(hrEvents)
    .values({
      companyId: context.companyId,
      eventId: event.eventId,
      type: event.type,
      hrId: event.employee.hrId,
      payload,
      payloadHash,
      occurredAt: new Date(payload.occurredAt),
      source: context.source,
      apiKeyId: context.apiKeyId ?? null,
      submittedBy: context.userId ?? null,
    })
    .onConflictDoNothing({ target: [hrEvents.companyId, hrEvents.eventId] })
    .returning({ id: hrEvents.id });

  if (inserted) {
    logger.info('hr_event.accepted', { companyId: context.companyId, eventId: event.eventId, type: event.type });
    return { status: 'accepted', id: inserted.id, eventId: event.eventId };
  }

  const [existing] = await db
    .select({ id: hrEvents.id, payloadHash: hrEvents.payloadHash })
    .from(hrEvents)
    .where(and(eq(hrEvents.companyId, context.companyId), eq(hrEvents.eventId, event.eventId)));
  if (existing.payloadHash !== payloadHash) {
    logger.warn('hr_event.conflict', { companyId: context.companyId, eventId: event.eventId });
    throw new DomainError('EVENT_ID_CONFLICT');
  }
  await db
    .update(hrEvents)
    .set({ duplicateCount: sql`${hrEvents.duplicateCount} + 1` })
    .where(eq(hrEvents.id, existing.id));
  logger.info('hr_event.duplicate', { companyId: context.companyId, eventId: event.eventId });
  return { status: 'duplicate', id: existing.id, eventId: event.eventId };
}

export type ProcessResult =
  | { outcome: 'processed'; employeeId: string }
  | { outcome: 'stale'; employeeId: string }
  | { outcome: 'skipped' }
  | { outcome: 'failed'; error: string; retryAt: Date | null };

export type ProcessOptions = {
  now?: Date;
};

class PermanentFailure extends DomainError {}

function actorOf(event: HrEvent): Actor {
  if (event.apiKeyId) return { type: 'api_key', id: event.apiKeyId };
  if (event.submittedBy) return { type: 'user', id: event.submittedBy };
  return { type: 'system' };
}

const employeeAuditActions = {
  'employee.hired': 'employee.hired',
  'employee.role_changed': 'employee.role_changed',
  'employee.terminated': 'employee.terminated',
} as const;

export async function processEvent(id: string, options: ProcessOptions = {}): Promise<ProcessResult> {
  const now = options.now ?? new Date();
  let event: HrEvent | undefined;
  try {
    return await db.transaction(async tx => {
      [event] = await tx.select().from(hrEvents).where(eq(hrEvents.id, id)).for('update', { skipLocked: true });
      if (!event || event.status === 'processed' || event.status === 'stale') return { outcome: 'skipped' };

      const [company] = await tx
        .select({ id: companies.id, deletedAt: companies.deletedAt })
        .from(companies)
        .where(eq(companies.id, event.companyId))
        .for('share');
      if (!company || company.deletedAt) throw new PermanentFailure('COMPANY_DELETED', 'The company was deleted.');

      const result = await applyEvent(tx, event, now);

      await tx
        .update(hrEvents)
        .set({
          status: result.outcome,
          attempts: event.attempts + 1,
          lastError: null,
          nextAttemptAt: null,
          processedAt: now,
        })
        .where(eq(hrEvents.id, event.id));
      logger.info(`hr_event.${result.outcome}`, {
        companyId: event.companyId,
        eventId: event.eventId,
        employeeId: result.employeeId,
        latencyMs: now.getTime() - event.receivedAt.getTime(),
      });
      return result;
    });
  } catch (error) {
    if (!event) throw error;
    return recordFailure(event, error, now);
  }
}

async function applyEvent(
  tx: Tx,
  event: HrEvent,
  now: Date,
): Promise<{ outcome: 'processed' | 'stale'; employeeId: string }> {
  const input = event.payload as HrEventInput;
  const actor = actorOf(event);
  const occurredAt = event.occurredAt;

  const created = nextEmployeeState(null, input);
  const [inserted] = await tx
    .insert(employees)
    .values({
      companyId: event.companyId,
      hrId: input.employee.hrId,
      ...created,
      stateAsOf: occurredAt,
      lastEventId: event.eventId,
    })
    .onConflictDoNothing({ target: [employees.companyId, employees.hrId] })
    .returning();

  let before: Employee | null = null;
  let employee: Employee;
  if (inserted) {
    employee = inserted;
  } else {
    [before] = await tx
      .select()
      .from(employees)
      .where(and(eq(employees.companyId, event.companyId), eq(employees.hrId, input.employee.hrId)))
      .for('update');

    if (isStale(occurredAt, before.stateAsOf)) {
      await audit(tx, {
        companyId: event.companyId,
        actor,
        action: 'hr_event.stale',
        targetType: 'hr_event',
        targetId: event.id,
        causeEventId: event.id,
        employeeId: before.id,
        data: {
          eventId: event.eventId,
          occurredAt: occurredAt.toISOString(),
          stateAsOf: before.stateAsOf.toISOString(),
        },
      });
      return { outcome: 'stale', employeeId: before.id };
    }

    [employee] = await tx
      .update(employees)
      .set({ ...nextEmployeeState(before, input), stateAsOf: occurredAt, lastEventId: event.eventId })
      .where(eq(employees.id, before.id))
      .returning();
  }

  const rehire = event.type === 'employee.hired' && before?.status === 'terminated';
  await audit(tx, {
    companyId: event.companyId,
    actor,
    action: rehire ? 'employee.rehired' : employeeAuditActions[event.type],
    targetType: 'employee',
    targetId: employee.id,
    causeEventId: event.id,
    employeeId: employee.id,
    data: {
      eventId: event.eventId,
      occurredAt: occurredAt.toISOString(),
      created: !before,
      before: before ? { status: before.status, jobRole: before.jobRole } : null,
      after: { status: employee.status, jobRole: employee.jobRole },
    },
  });

  const openProducts = await tx
    .selectDistinct({ productId: seatAssignments.productId })
    .from(seatAssignments)
    .where(and(eq(seatAssignments.employeeId, employee.id), inArray(seatAssignments.status, ['waiting', 'assigned'])));
  const ruleProducts =
    employee.status === 'active'
      ? await tx
          .select({ productId: entitlementRules.productId })
          .from(entitlementRules)
          .where(and(eq(entitlementRules.companyId, event.companyId), eq(entitlementRules.jobRole, employee.jobRole)))
      : [];
  const productIds = [...new Set([...openProducts, ...ruleProducts].map(row => row.productId))].sort();

  for (const productId of productIds) {
    await recomputePool(tx, {
      companyId: event.companyId,
      productId,
      now,
      cause: { actor, eventId: event.id },
      eligibleSinceFor: candidate =>
        candidate.id === employee.id
          ? occurredAt
          : candidate.stateAsOf > candidate.ruleCreatedAt
            ? candidate.stateAsOf
            : candidate.ruleCreatedAt,
      reasonFor: candidate => lossReasonForEmployee(candidate.id === employee.id ? employee : candidate),
    });
  }

  if (event.type === 'employee.hired') {
    await onEmployeeHired(tx, { companyId: event.companyId, employee, actor, causeEventId: event.id });
  }

  return { outcome: 'processed', employeeId: employee.id };
}

async function recordFailure(event: HrEvent, error: unknown, now: Date): Promise<ProcessResult> {
  const message = error instanceof Error ? error.message : String(error);
  const attempts = event.attempts + 1;
  const retryAt = error instanceof PermanentFailure ? null : nextAttemptAt(attempts, now);
  await db
    .update(hrEvents)
    .set({ status: 'failed', attempts, lastError: message.slice(0, 2000), nextAttemptAt: retryAt })
    .where(eq(hrEvents.id, event.id));
  logger.error('hr_event.failed', {
    companyId: event.companyId,
    eventId: event.eventId,
    attempts,
    retryAt: retryAt?.toISOString() ?? null,
    error: message,
  });
  return { outcome: 'failed', error: message, retryAt };
}

export async function processDueEvents(limit = 50, now = new Date()) {
  const due = await db
    .select({ id: hrEvents.id })
    .from(hrEvents)
    .where(
      and(
        or(eq(hrEvents.status, 'pending'), eq(hrEvents.status, 'failed')),
        isNotNull(hrEvents.nextAttemptAt),
        lte(hrEvents.nextAttemptAt, now),
      ),
    )
    .orderBy(asc(hrEvents.receivedAt))
    .limit(limit);
  const results: ProcessResult[] = [];
  for (const { id } of due) results.push(await processEvent(id));
  return results;
}

export async function retryEvent(actor: Actor, companyId: string, id: string) {
  const [event] = await db
    .select({ id: hrEvents.id, status: hrEvents.status, eventId: hrEvents.eventId })
    .from(hrEvents)
    .where(and(eq(hrEvents.id, id), eq(hrEvents.companyId, companyId)));
  if (!event) throw new DomainError('EVENT_NOT_FOUND');
  if (event.status !== 'failed') throw new DomainError('EVENT_NOT_RETRYABLE');
  await audit(db, {
    companyId,
    actor,
    action: 'hr_event.retry_requested',
    targetType: 'hr_event',
    targetId: id,
    data: { eventId: event.eventId },
  });
  return processEvent(id);
}

export type InboxFilter = HrEventStatus | 'duplicate' | 'retrying' | undefined;

export async function listHrEvents(companyId: string, filter: InboxFilter, limit = 100) {
  const conditions = [eq(hrEvents.companyId, companyId)];
  if (filter === 'duplicate') conditions.push(sql`${hrEvents.duplicateCount} > 0`);
  else if (filter === 'retrying')
    conditions.push(and(eq(hrEvents.status, 'failed'), isNotNull(hrEvents.nextAttemptAt))!);
  else if (filter) conditions.push(eq(hrEvents.status, filter));

  return db
    .select({
      id: hrEvents.id,
      eventId: hrEvents.eventId,
      type: hrEvents.type,
      hrId: hrEvents.hrId,
      occurredAt: hrEvents.occurredAt,
      receivedAt: hrEvents.receivedAt,
      processedAt: hrEvents.processedAt,
      source: hrEvents.source,
      status: hrEvents.status,
      attempts: hrEvents.attempts,
      lastError: hrEvents.lastError,
      nextAttemptAt: hrEvents.nextAttemptAt,
      duplicateCount: hrEvents.duplicateCount,
      employeeId: employees.id,
    })
    .from(hrEvents)
    .leftJoin(employees, and(eq(employees.companyId, hrEvents.companyId), eq(employees.hrId, hrEvents.hrId)))
    .where(and(...conditions))
    .orderBy(desc(hrEvents.receivedAt))
    .limit(limit);
}

export async function countHrEventsByStatus(companyId: string) {
  const rows = await db
    .select({ status: hrEvents.status, value: sql<number>`count(*)`.mapWith(Number) })
    .from(hrEvents)
    .where(eq(hrEvents.companyId, companyId))
    .groupBy(hrEvents.status);
  return Object.fromEntries(rows.map(row => [row.status, row.value])) as Partial<Record<HrEventStatus, number>>;
}

export { MAX_ATTEMPTS };
