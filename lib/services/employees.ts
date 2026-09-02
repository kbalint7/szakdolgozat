import { and, asc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { auditLog, employees, hrEvents, memberships, products, seatAssignments, users } from '@/db/schema';

export type EmployeeSeat = {
  productId: string;
  productName: string;
  status: 'assigned' | 'waiting';
  position: number | null;
};

async function openSeats(companyId: string, employeeIds?: string[]) {
  const ranked = db
    .select({
      employeeId: seatAssignments.employeeId,
      productId: seatAssignments.productId,
      status: seatAssignments.status,
      position: sql<number | null>`case when ${seatAssignments.status} = 'waiting' then row_number() over (
          partition by ${seatAssignments.productId}, ${seatAssignments.status}
          order by ${seatAssignments.eligibleSince}, ${employees.hrId} collate "C") end`.as('position'),
    })
    .from(seatAssignments)
    .innerJoin(employees, eq(employees.id, seatAssignments.employeeId))
    .where(and(eq(seatAssignments.companyId, companyId), inArray(seatAssignments.status, ['waiting', 'assigned'])))
    .as('ranked');

  return db
    .select({
      employeeId: ranked.employeeId,
      productId: ranked.productId,
      productName: products.name,
      status: ranked.status,
      position: sql<number | null>`${ranked.position}`.mapWith(value => (value === null ? null : Number(value))),
    })
    .from(ranked)
    .innerJoin(products, eq(products.id, ranked.productId))
    .where(employeeIds ? inArray(ranked.employeeId, employeeIds) : undefined)
    .orderBy(asc(products.name));
}

export type EmployeeFilter = { search?: string; status?: 'active' | 'terminated' };

export async function listEmployees(companyId: string, filter: EmployeeFilter = {}) {
  const conditions: SQL[] = [eq(employees.companyId, companyId)];
  if (filter.status) conditions.push(eq(employees.status, filter.status));
  if (filter.search) {
    const pattern = `%${filter.search.replace(/[\\%_]/g, char => `\\${char}`)}%`;
    conditions.push(
      or(
        ilike(employees.hrId, pattern),
        ilike(employees.name, pattern),
        ilike(employees.email, pattern),
        ilike(employees.jobRole, pattern),
      )!,
    );
  }

  const [rows, seats] = await Promise.all([
    db
      .select({
        id: employees.id,
        hrId: employees.hrId,
        name: employees.name,
        email: employees.email,
        jobRole: employees.jobRole,
        status: employees.status,
        stateAsOf: employees.stateAsOf,
        linkedUser: { id: users.id, name: users.name, email: users.email },
      })
      .from(employees)
      .leftJoin(memberships, eq(memberships.id, employees.membershipId))
      .leftJoin(users, eq(users.id, memberships.userId))
      .where(and(...conditions))
      .orderBy(sql`${employees.hrId} collate "C"`),
    openSeats(companyId),
  ]);

  const seatsByEmployee = new Map<string, EmployeeSeat[]>();
  for (const seat of seats) {
    const list = seatsByEmployee.get(seat.employeeId) ?? [];
    list.push({
      productId: seat.productId,
      productName: seat.productName,
      status: seat.status as EmployeeSeat['status'],
      position: seat.position,
    });
    seatsByEmployee.set(seat.employeeId, list);
  }
  return rows.map(row => ({
    ...row,
    linkedUser: row.linkedUser?.id ? row.linkedUser : null,
    seats: seatsByEmployee.get(row.id) ?? [],
  }));
}

export async function getEmployee(companyId: string, employeeId: string) {
  const [row] = await db
    .select({
      employee: employees,
      linkedUser: { id: users.id, name: users.name, email: users.email },
    })
    .from(employees)
    .leftJoin(memberships, eq(memberships.id, employees.membershipId))
    .leftJoin(users, eq(users.id, memberships.userId))
    .where(and(eq(employees.id, employeeId), eq(employees.companyId, companyId)));
  if (!row) return null;
  const seats = await openSeats(companyId, [employeeId]);
  return {
    ...row.employee,
    linkedUser: row.linkedUser?.id ? row.linkedUser : null,
    seats: seats.map(seat => ({ ...seat, status: seat.status as EmployeeSeat['status'] })),
  };
}

export type TimelineItem =
  | {
      kind: 'event';
      at: Date;
      id: string;
      eventId: string;
      type: string;
      occurredAt: Date;
      status: string;
      source: string;
      attempts: number;
      lastError: string | null;
    }
  | {
      kind: 'decision';
      at: Date;
      id: number;
      action: string;
      reason: string | null;
      productName: string | null;
      cause: { eventId: string; occurredAt: Date } | null;
      data: Record<string, unknown> | null;
    };

export async function getEmployeeTimeline(companyId: string, employee: { id: string; hrId: string }) {
  const causeEvents = db
    .select({ id: hrEvents.id, eventId: hrEvents.eventId, occurredAt: hrEvents.occurredAt })
    .from(hrEvents)
    .as('cause_events');

  const [events, decisions] = await Promise.all([
    db
      .select()
      .from(hrEvents)
      .where(and(eq(hrEvents.companyId, companyId), eq(hrEvents.hrId, employee.hrId))),
    db
      .select({
        id: auditLog.id,
        at: auditLog.createdAt,
        action: auditLog.action,
        reason: auditLog.reason,
        data: auditLog.data,
        productName: products.name,
        causeEventId: causeEvents.eventId,
        causeOccurredAt: causeEvents.occurredAt,
      })
      .from(auditLog)
      .leftJoin(causeEvents, eq(causeEvents.id, auditLog.causeEventId))
      .leftJoin(products, sql`${products.id}::text = ${auditLog.data} ->> 'productId'`)
      .where(and(eq(auditLog.companyId, companyId), eq(auditLog.employeeId, employee.id))),
  ]);

  const items: TimelineItem[] = [
    ...events.map((event): TimelineItem => ({
      kind: 'event',
      at: event.receivedAt,
      id: event.id,
      eventId: event.eventId,
      type: event.type,
      occurredAt: event.occurredAt,
      status: event.status,
      source: event.source,
      attempts: event.attempts,
      lastError: event.lastError,
    })),
    ...decisions.map((entry): TimelineItem => ({
      kind: 'decision',
      at: entry.at,
      id: entry.id,
      action: entry.action,
      reason: entry.reason,
      productName: entry.productName,
      cause:
        entry.causeEventId && entry.causeOccurredAt
          ? { eventId: entry.causeEventId, occurredAt: entry.causeOccurredAt }
          : null,
      data: entry.data,
    })),
  ];

  return items.sort((a, b) => {
    const byTime = a.at.getTime() - b.at.getTime();
    if (byTime !== 0) return byTime;
    if (a.kind !== b.kind) return a.kind === 'event' ? -1 : 1;
    return a.kind === 'decision' && b.kind === 'decision' ? a.id - b.id : 0;
  });
}

export async function countEmployees(companyId: string) {
  const [row] = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
      active: sql<number>`count(*) filter (where ${employees.status} = 'active')`.mapWith(Number),
    })
    .from(employees)
    .where(eq(employees.companyId, companyId));
  return row;
}
