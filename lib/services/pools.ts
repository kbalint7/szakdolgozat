import { and, eq, inArray, isNull, sql } from 'drizzle-orm';

import { db, type Tx } from '@/db/drizzle';
import { companies, employees, entitlementRules, licenses, seatAssignments, seatPools } from '@/db/schema';
import { planPool, type EndReason, type OpenRow, type PoolAction } from '@/lib/domain/allocation';
import { poolCapacity } from '@/lib/domain/capacity';
import { lossReasonForEmployee } from '@/lib/domain/eligibility';
import { DomainError } from '@/lib/errors';
import { logger } from '@/lib/logger';

import { audit, type Actor, type AuditInput } from './audit';

export type PoolCause = {
  actor: Actor;
  eventId?: string | null;
  ruleId?: string | null;
};

type EligibleEmployeeRow = {
  id: string;
  hrId: string;
  stateAsOf: Date;
  ruleCreatedAt: Date;
};

export type EmployeeSnapshot = { id: string; status: 'active' | 'terminated'; jobRole: string };

export type RecomputeOptions = {
  companyId: string;
  productId: string;
  now: Date;
  cause: PoolCause;
  eligibleSinceFor?: (employee: EligibleEmployeeRow) => Date;
  reasonFor?: (employee: EmployeeSnapshot) => EndReason;
};

export type PoolSummary = {
  productId: string;
  capacity: number;
  assigned: number;
  waiting: number;
  actions: PoolAction[];
};

export async function lockPool(tx: Tx, companyId: string, productId: string) {
  await tx.insert(seatPools).values({ companyId, productId }).onConflictDoNothing();
  await tx
    .select({ companyId: seatPools.companyId })
    .from(seatPools)
    .where(and(eq(seatPools.companyId, companyId), eq(seatPools.productId, productId)))
    .for('update');
}

export async function recomputePool(tx: Tx, options: RecomputeOptions): Promise<PoolSummary> {
  const { companyId, productId, now, cause } = options;
  await lockPool(tx, companyId, productId);

  const poolLicenses = await tx
    .select({
      seatCount: licenses.seatCount,
      status: licenses.status,
      validFrom: licenses.validFrom,
      validUntil: licenses.validUntil,
    })
    .from(licenses)
    .where(and(eq(licenses.companyId, companyId), eq(licenses.productId, productId)));
  const capacity = poolCapacity(poolLicenses, now);

  const eligibleRows: EligibleEmployeeRow[] = await tx
    .select({
      id: employees.id,
      hrId: employees.hrId,
      stateAsOf: employees.stateAsOf,
      ruleCreatedAt: entitlementRules.createdAt,
    })
    .from(employees)
    .innerJoin(
      entitlementRules,
      and(
        eq(entitlementRules.companyId, employees.companyId),
        eq(entitlementRules.jobRole, employees.jobRole),
        eq(entitlementRules.productId, productId),
      ),
    )
    .where(and(eq(employees.companyId, companyId), eq(employees.status, 'active')));

  const currentRows = await tx
    .select({
      rowId: seatAssignments.id,
      employeeId: seatAssignments.employeeId,
      hrId: employees.hrId,
      employeeStatus: employees.status,
      jobRole: employees.jobRole,
      status: seatAssignments.status,
      eligibleSince: seatAssignments.eligibleSince,
      assignedAt: seatAssignments.assignedAt,
    })
    .from(seatAssignments)
    .innerJoin(employees, eq(employees.id, seatAssignments.employeeId))
    .where(
      and(
        eq(seatAssignments.companyId, companyId),
        eq(seatAssignments.productId, productId),
        inArray(seatAssignments.status, ['waiting', 'assigned']),
      ),
    );

  const employeeById = new Map(
    currentRows.map(row => [row.employeeId, { id: row.employeeId, status: row.employeeStatus, jobRole: row.jobRole }]),
  );
  const reasonFor = options.reasonFor ?? lossReasonForEmployee;
  const eligibleSinceFor =
    options.eligibleSinceFor ??
    ((employee: EligibleEmployeeRow) =>
      employee.stateAsOf > employee.ruleCreatedAt ? employee.stateAsOf : employee.ruleCreatedAt);

  const plan = planPool({
    capacity,
    eligible: eligibleRows.map(employee => ({
      employeeId: employee.id,
      hrId: employee.hrId,
      eligibleSince: eligibleSinceFor(employee),
    })),
    current: currentRows.map((row): OpenRow => ({
      rowId: row.rowId,
      employeeId: row.employeeId,
      hrId: row.hrId,
      status: row.status as 'waiting' | 'assigned',
      eligibleSince: row.eligibleSince,
      assignedAt: row.assignedAt,
    })),
    reasonFor: employeeId => reasonFor(employeeById.get(employeeId)!),
  });

  await applyPlan(tx, { companyId, productId, now, cause, plan });

  const [{ assigned, waiting }] = await tx
    .select({
      assigned: sql<number>`count(*) filter (where ${seatAssignments.status} = 'assigned')`.mapWith(Number),
      waiting: sql<number>`count(*) filter (where ${seatAssignments.status} = 'waiting')`.mapWith(Number),
    })
    .from(seatAssignments)
    .where(and(eq(seatAssignments.companyId, companyId), eq(seatAssignments.productId, productId)));
  if (assigned > capacity) {
    logger.error('pool.invariant_violated', { companyId, productId, assigned, capacity });
    throw new DomainError('CAPACITY_INVARIANT_VIOLATED');
  }

  if (plan.length > 0) {
    logger.info('pool.recomputed', {
      companyId,
      productId,
      capacity,
      assigned,
      waiting,
      actions: plan.length,
      eventId: cause.eventId ?? undefined,
    });
  }
  return { productId, capacity, assigned, waiting, actions: plan };
}

async function applyPlan(
  tx: Tx,
  { companyId, productId, now, cause, plan }: Omit<RecomputeOptions, 'reasonFor'> & { plan: PoolAction[] },
) {
  const entries: AuditInput[] = [];
  const base = {
    companyId,
    actor: cause.actor,
    causeEventId: cause.eventId ?? null,
    targetType: 'seat_assignment',
  };
  const causeColumns = { causeEventId: cause.eventId ?? null, causeRuleId: cause.ruleId ?? null };

  for (const action of plan) {
    switch (action.type) {
      case 'REVOKE':
      case 'CANCEL': {
        await tx
          .update(seatAssignments)
          .set({
            status: action.type === 'REVOKE' ? 'revoked' : 'cancelled',
            endedAt: now,
            endReason: action.reason,
            ...causeColumns,
          })
          .where(eq(seatAssignments.id, action.rowId));
        entries.push({
          ...base,
          action: action.type === 'REVOKE' ? 'seat.revoked' : 'seat.cancelled',
          targetId: action.rowId,
          reason: action.reason,
          employeeId: action.employeeId,
          data: { productId, ruleId: cause.ruleId ?? undefined },
        });
        break;
      }
      case 'REQUEUE': {
        await tx
          .update(seatAssignments)
          .set({ status: 'revoked', endedAt: now, endReason: 'CAPACITY_REDUCED', ...causeColumns })
          .where(eq(seatAssignments.id, action.rowId));
        const [row] = await tx
          .insert(seatAssignments)
          .values({
            companyId,
            productId,
            employeeId: action.employeeId,
            status: 'waiting',
            eligibleSince: action.eligibleSince,
            queueReason: 'CAPACITY_REDUCED',
            ...causeColumns,
          })
          .returning({ id: seatAssignments.id });
        entries.push({
          ...base,
          action: 'seat.requeued',
          targetId: row.id,
          reason: 'CAPACITY_REDUCED',
          employeeId: action.employeeId,
          data: { productId, revokedSeatId: action.rowId, eligibleSince: action.eligibleSince.toISOString() },
        });
        break;
      }
      case 'ENQUEUE': {
        const [row] = await tx
          .insert(seatAssignments)
          .values({
            companyId,
            productId,
            employeeId: action.employeeId,
            status: 'waiting',
            eligibleSince: action.eligibleSince,
            queueReason: 'RULE_MATCHED',
            ...causeColumns,
          })
          .returning({ id: seatAssignments.id });
        entries.push({
          ...base,
          action: 'seat.queued',
          targetId: row.id,
          reason: 'RULE_MATCHED',
          employeeId: action.employeeId,
          data: { productId, eligibleSince: action.eligibleSince.toISOString(), ruleId: cause.ruleId ?? undefined },
        });
        break;
      }
      case 'ASSIGN': {
        const [row] = await tx
          .update(seatAssignments)
          .set({ status: 'assigned', assignedAt: now, grantReason: action.reason, ...causeColumns })
          .where(
            and(
              eq(seatAssignments.companyId, companyId),
              eq(seatAssignments.productId, productId),
              eq(seatAssignments.employeeId, action.employeeId),
              eq(seatAssignments.status, 'waiting'),
            ),
          )
          .returning({ id: seatAssignments.id });
        if (!row) throw new DomainError('CONFLICT', `no waiting row for employee ${action.employeeId}`);
        entries.push({
          ...base,
          action: 'seat.assigned',
          targetId: row.id,
          reason: action.reason,
          employeeId: action.employeeId,
          data: { productId },
        });
        break;
      }
    }
  }
  await audit(tx, ...entries);
}

async function companyProductIds(tx: Tx, companyId: string): Promise<string[]> {
  const rows = await tx.execute<{ product_id: string }>(sql`
    select product_id from ${seatPools} where company_id = ${companyId}
    union select product_id from ${entitlementRules} where company_id = ${companyId}
    union select product_id from ${licenses} where company_id = ${companyId}
    order by product_id
  `);
  return rows.rows.map(row => row.product_id);
}

export async function reconcileCompany(companyId: string, actor: Actor, now = new Date()) {
  return db.transaction(async tx => {
    const [company] = await tx
      .select({ id: companies.id })
      .from(companies)
      .where(and(eq(companies.id, companyId), isNull(companies.deletedAt)))
      .for('share');
    if (!company) throw new DomainError('COMPANY_NOT_FOUND');

    const summaries: PoolSummary[] = [];
    for (const productId of await companyProductIds(tx, companyId)) {
      summaries.push(await recomputePool(tx, { companyId, productId, now, cause: { actor } }));
      await tx
        .update(seatPools)
        .set({ lastReconciledAt: now })
        .where(and(eq(seatPools.companyId, companyId), eq(seatPools.productId, productId)));
    }
    const changes = summaries.reduce((sum, s) => sum + s.actions.length, 0);
    await audit(tx, {
      companyId,
      actor,
      action: 'company.reconciled',
      targetType: 'company',
      targetId: companyId,
      data: { pools: summaries.length, changes },
    });
    return { pools: summaries.length, changes, summaries };
  });
}
