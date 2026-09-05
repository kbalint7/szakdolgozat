import { aliasedTable, and, desc, eq, gte, ilike, like, lt, sql, type SQL } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { apiKeys, auditLog, companies, employees, hrEvents, users } from '@/db/schema';
import type { AuditCategory } from '@/lib/domain/audit';

export type AuditFilter = {
  companyId: string | null;
  category?: AuditCategory;
  hrId?: string;
  from?: Date;
  to?: Date;
  before?: number;
  limit?: number;
};

const PAGE_SIZE = 50;

export async function listAuditEntries(filter: AuditFilter) {
  const actorUsers = aliasedTable(users, 'actor_users');
  const conditions: SQL[] = [];
  if (filter.companyId) conditions.push(eq(auditLog.companyId, filter.companyId));
  if (filter.category) conditions.push(like(auditLog.action, `${filter.category}.%`));
  if (filter.hrId) conditions.push(ilike(employees.hrId, `%${filter.hrId.replace(/[\\%_]/g, c => `\\${c}`)}%`));
  if (filter.from) conditions.push(gte(auditLog.createdAt, filter.from));
  if (filter.to) conditions.push(lt(auditLog.createdAt, filter.to));
  if (filter.before) conditions.push(lt(auditLog.id, filter.before));
  const limit = filter.limit ?? PAGE_SIZE;

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
    })
    .from(auditLog)
    .leftJoin(actorUsers, and(eq(auditLog.actorType, 'user'), eq(actorUsers.id, auditLog.actorId)))
    .leftJoin(apiKeys, and(eq(auditLog.actorType, 'api_key'), sql`${apiKeys.id}::text = ${auditLog.actorId}`))
    .leftJoin(companies, eq(companies.id, auditLog.companyId))
    .leftJoin(employees, eq(employees.id, auditLog.employeeId))
    .leftJoin(hrEvents, eq(hrEvents.id, auditLog.causeEventId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(auditLog.id))
    .limit(limit + 1);

  return {
    entries: rows.slice(0, limit).map(row => ({ ...row, employee: row.employee?.id ? row.employee : null })),
    nextBefore: rows.length > limit ? rows[limit - 1].id : null,
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
