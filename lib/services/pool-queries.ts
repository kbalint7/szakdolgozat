import { and, asc, count, eq, inArray, sql } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { employees, entitlementRules, licenses, products, seatAssignments } from '@/db/schema';
import { waitlistPositions } from '@/lib/domain/allocation';
import { earliestExpiry, poolCapacity } from '@/lib/domain/capacity';
import { compareSeniority } from '@/lib/domain/seniority';

export type PoolOverview = {
  productId: string;
  productName: string;
  productSlug: string;
  capacity: number;
  assigned: number;
  waiting: number;
  free: number;
  earliestExpiry: Date | null;
  ruleCount: number;
};

export async function getCompanyPools(companyId: string, now = new Date()): Promise<PoolOverview[]> {
  const [companyLicenses, seatCounts, ruleCounts] = await Promise.all([
    db
      .select({
        productId: licenses.productId,
        seatCount: licenses.seatCount,
        status: licenses.status,
        validFrom: licenses.validFrom,
        validUntil: licenses.validUntil,
      })
      .from(licenses)
      .where(eq(licenses.companyId, companyId)),
    db
      .select({ productId: seatAssignments.productId, status: seatAssignments.status, value: count() })
      .from(seatAssignments)
      .where(and(eq(seatAssignments.companyId, companyId), inArray(seatAssignments.status, ['waiting', 'assigned'])))
      .groupBy(seatAssignments.productId, seatAssignments.status),
    db
      .select({ productId: entitlementRules.productId, value: count() })
      .from(entitlementRules)
      .where(eq(entitlementRules.companyId, companyId))
      .groupBy(entitlementRules.productId),
  ]);

  const productIds = [
    ...new Set([
      ...companyLicenses.map(l => l.productId),
      ...seatCounts.map(s => s.productId),
      ...ruleCounts.map(r => r.productId),
    ]),
  ];
  if (productIds.length === 0) return [];
  const productRows = await db
    .select({ id: products.id, name: products.name, slug: products.slug })
    .from(products)
    .where(inArray(products.id, productIds))
    .orderBy(asc(products.name));

  return productRows.map(product => {
    const productLicenses = companyLicenses.filter(l => l.productId === product.id);
    const capacity = poolCapacity(productLicenses, now);
    const assigned = seatCounts.find(s => s.productId === product.id && s.status === 'assigned')?.value ?? 0;
    const waiting = seatCounts.find(s => s.productId === product.id && s.status === 'waiting')?.value ?? 0;
    return {
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      capacity,
      assigned,
      waiting,
      free: Math.max(0, capacity - assigned),
      earliestExpiry: earliestExpiry(productLicenses, now),
      ruleCount: ruleCounts.find(r => r.productId === product.id)?.value ?? 0,
    };
  });
}

export async function getPoolDetail(companyId: string, productId: string, now = new Date()) {
  const [product] = await db
    .select({ id: products.id, name: products.name, slug: products.slug })
    .from(products)
    .where(eq(products.id, productId));
  if (!product) return null;

  const [poolLicenses, rows] = await Promise.all([
    db
      .select({
        seatCount: licenses.seatCount,
        status: licenses.status,
        validFrom: licenses.validFrom,
        validUntil: licenses.validUntil,
      })
      .from(licenses)
      .where(and(eq(licenses.companyId, companyId), eq(licenses.productId, productId))),
    db
      .select({
        id: seatAssignments.id,
        status: seatAssignments.status,
        eligibleSince: seatAssignments.eligibleSince,
        assignedAt: seatAssignments.assignedAt,
        queueReason: seatAssignments.queueReason,
        grantReason: seatAssignments.grantReason,
        employee: {
          id: employees.id,
          hrId: employees.hrId,
          name: employees.name,
          jobRole: employees.jobRole,
          linked: sql<boolean>`${employees.membershipId} is not null`,
        },
      })
      .from(seatAssignments)
      .innerJoin(employees, eq(employees.id, seatAssignments.employeeId))
      .where(
        and(
          eq(seatAssignments.companyId, companyId),
          eq(seatAssignments.productId, productId),
          inArray(seatAssignments.status, ['waiting', 'assigned']),
        ),
      ),
  ]);

  const capacity = poolCapacity(poolLicenses, now);
  const assigned = rows
    .filter(row => row.status === 'assigned' && row.assignedAt)
    .sort((a, b) =>
      compareSeniority(
        { assignedAt: a.assignedAt!, eligibleSince: a.eligibleSince, hrId: a.employee.hrId },
        { assignedAt: b.assignedAt!, eligibleSince: b.eligibleSince, hrId: b.employee.hrId },
      ),
    )
    .map((row, index) => ({ ...row, rank: index + 1, withinCapacity: index < capacity }));

  const waitingRows = rows.filter(row => row.status === 'waiting');
  const positions = waitlistPositions(
    waitingRows.map(row => ({
      employeeId: row.employee.id,
      eligibleSince: row.eligibleSince,
      hrId: row.employee.hrId,
    })),
  );
  const waitlist = waitingRows
    .map(row => ({ ...row, position: positions.get(row.employee.id)! }))
    .sort((a, b) => a.position - b.position);

  return {
    product,
    capacity,
    earliestExpiry: earliestExpiry(poolLicenses, now),
    assigned,
    waitlist,
  };
}
