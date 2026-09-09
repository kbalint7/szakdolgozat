import { count, eq } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { memberships } from '@/db/schema';

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
  };
}
