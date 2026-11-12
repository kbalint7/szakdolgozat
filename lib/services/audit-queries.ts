import { aliasedTable, and, count, desc, eq, gte, ilike, like, lt, sql, type SQL } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { apiKeys, auditLog, companies, employees, hrEvents, products, users } from '@/db/schema';
import type { AuditCategory } from '@/lib/domain/audit';

export type AuditFilter = {
  companyId: string | null;
  category?: AuditCategory;
  hrId?: string;
  companyName?: string;
  from?: Date;
  to?: Date;
  limit?: number;
};

export const AUDIT_PAGE_SIZE = 50;

const STEP_LOOKAHEAD = 20;

type StepEntry = {
  createdAt: Date;
  actorType: string;
  actorId: string | null;
  causeEventId: string | null;
  employee: { id: string } | null;
};

export function sameAuditStep(a: StepEntry, b: StepEntry): boolean {
  if (!a.employee || a.employee.id !== b.employee?.id) return false;
  if (a.causeEventId || b.causeEventId) return a.causeEventId === b.causeEventId;
  return (
    a.actorType === b.actorType &&
    a.actorId === b.actorId &&
    Math.abs(a.createdAt.getTime() - b.createdAt.getTime()) < 2000
  );
}

function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, char => `\\${char}`);
}

export async function listAuditEntries(filter: AuditFilter) {
  const actorUsers = aliasedTable(users, 'actor_users');
  const conditions: SQL[] = [];
  if (filter.companyId) conditions.push(eq(auditLog.companyId, filter.companyId));
  if (filter.category) conditions.push(like(auditLog.action, `${filter.category}.%`));
  if (filter.hrId) conditions.push(ilike(employees.hrId, `%${escapeLike(filter.hrId)}%`));
  if (filter.companyName) conditions.push(ilike(companies.name, `%${escapeLike(filter.companyName)}%`));
  if (filter.from) conditions.push(gte(auditLog.createdAt, filter.from));
  if (filter.to) conditions.push(lt(auditLog.createdAt, filter.to));
  const limit = filter.limit ?? AUDIT_PAGE_SIZE;
  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: auditLog.id,
      createdAt: auditLog.createdAt,
      actorType: auditLog.actorType,
      actorId: auditLog.actorId,
      actorName: sql<string | null>`coalesce(${actorUsers.name}, ${apiKeys.name})`,
      action: auditLog.action,
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      reason: auditLog.reason,
      data: auditLog.data,
      companyId: auditLog.companyId,
      companyName: companies.name,
      employee: { id: employees.id, hrId: employees.hrId, name: employees.name },
      causeEventId: hrEvents.eventId,
      causeEvent: { id: hrEvents.id, type: hrEvents.type, hrId: hrEvents.hrId },
      productName: products.name,
    })
    .from(auditLog)
    .leftJoin(actorUsers, and(eq(auditLog.actorType, 'user'), eq(actorUsers.id, auditLog.actorId)))
    .leftJoin(apiKeys, and(eq(auditLog.actorType, 'api_key'), sql`${apiKeys.id}::text = ${auditLog.actorId}`))
    .leftJoin(companies, eq(companies.id, auditLog.companyId))
    .leftJoin(employees, eq(employees.id, auditLog.employeeId))
    .leftJoin(hrEvents, eq(hrEvents.id, auditLog.causeEventId))
    .leftJoin(products, sql`${products.id}::text = ${auditLog.data}->>'productId'`)
    .where(where)
    .orderBy(desc(auditLog.id))
    .limit(limit + STEP_LOOKAHEAD + 1);

  const [{ total }] = await db
    .select({ total: count() })
    .from(auditLog)
    .leftJoin(companies, eq(companies.id, auditLog.companyId))
    .leftJoin(employees, eq(employees.id, auditLog.employeeId))
    .where(where);

  const all = rows.map(row => ({
    ...row,
    employee: row.employee?.id ? row.employee : null,
    causeEvent: row.causeEvent?.id ? row.causeEvent : null,
  }));
  let end = Math.min(limit, all.length);
  while (end > 0 && end < all.length && end < limit + STEP_LOOKAHEAD && sameAuditStep(all[end - 1], all[end])) end++;

  return {
    entries: all.slice(0, end),
    total,
  };
}

export function budapestDayStart(day: string): Date {
  const utcMidnight = new Date(`${day}T00:00:00Z`);
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Budapest', timeZoneName: 'longOffset' })
    .formatToParts(utcMidnight)
    .find(part => part.type === 'timeZoneName')?.value;
  const match = offset?.match(/GMT([+-])(\d{2}):(\d{2})/);
  const minutes = match ? (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) : 0;
  return new Date(utcMidnight.getTime() - minutes * 60_000);
}

export function budapestDayEnd(day: string): Date {
  const next = new Date(`${day}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return budapestDayStart(next.toISOString().slice(0, 10));
}
