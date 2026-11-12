import { and, asc, count, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { employees, memberships, users } from '@/db/schema';

import { countEmployees } from './employees';
import { countHrEventsByStatus } from './hr-events';
import { getCompanyPools } from './pool-queries';

export async function getCompanyOverview(companyId: string) {
  const [[members], employees, pools, events] = await Promise.all([
    db.select({ value: count() }).from(memberships).where(eq(memberships.companyId, companyId)),
    countEmployees(companyId),
    getCompanyPools(companyId),
    countHrEventsByStatus(companyId),
  ]);
  return {
    memberCount: members.value,
    employeeCount: employees.total,
    activeEmployeeCount: employees.active,
    pools,
    failedEvents: events.failed ?? 0,
    retryingEvents: events.retrying,
  };
}

export async function getMemberOverview(companyId: string, membershipId: string) {
  const [[employee], managers] = await Promise.all([
    db
      .select({ name: employees.name, hrId: employees.hrId, jobRole: employees.jobRole, status: employees.status })
      .from(employees)
      .where(and(eq(employees.companyId, companyId), eq(employees.membershipId, membershipId)))
      .limit(1),
    db
      .select({ name: users.name, role: memberships.role })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(and(eq(memberships.companyId, companyId), inArray(memberships.role, ['owner', 'admin'])))
      .orderBy(sql`case ${memberships.role} when 'owner' then 0 else 1 end`, asc(users.name)),
  ]);
  return { employee: employee ?? null, managers };
}
