import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import {
  companies,
  employees,
  licenseChecks,
  licenses,
  memberships,
  products,
  seatAssignments,
  users,
} from '@/db/schema';
import { earliestExpiry, poolCapacity } from '@/lib/domain/capacity';
import type { CompanyEvaluation } from '@/lib/domain/license-check';

type SeatRow = {
  companyId: string;
  status: 'waiting' | 'assigned';
  assignedAt: Date | null;
  ordinal: number;
};

async function seatsOfUser(userId: string, productId: string): Promise<SeatRow[]> {
  const result = await db.execute<{
    company_id: string;
    status: 'waiting' | 'assigned';
    assigned_at: Date | null;
    ordinal: string;
  }>(sql`
    with ranked as (
      select s.company_id, s.employee_id, s.status, s.assigned_at,
        row_number() over (
          partition by s.company_id, s.status
          order by
            case when s.status = 'assigned' then s.assigned_at end,
            s.eligible_since,
            e.hr_id collate "C"
        ) as ordinal
      from ${seatAssignments} s
      join ${employees} e on e.id = s.employee_id
      where s.product_id = ${productId}
        and s.status in ('waiting', 'assigned')
        and s.company_id in (select company_id from ${memberships} where user_id = ${userId})
    )
    select r.company_id, r.status, r.assigned_at, r.ordinal
    from ranked r
    join ${employees} e on e.id = r.employee_id
    join ${memberships} m on m.id = e.membership_id
    where m.user_id = ${userId}
  `);
  return result.rows.map(row => ({
    companyId: row.company_id,
    status: row.status,
    assignedAt: row.assigned_at ? new Date(row.assigned_at) : null,
    ordinal: Number(row.ordinal),
  }));
}

async function loadEvaluations(userId: string, productId: string, now: Date) {
  const userMemberships = await db
    .select({
      companyId: companies.id,
      companyName: companies.name,
      employeeId: employees.id,
    })
    .from(memberships)
    .innerJoin(companies, and(eq(companies.id, memberships.companyId), isNull(companies.deletedAt)))
    .leftJoin(employees, eq(employees.membershipId, memberships.id))
    .where(eq(memberships.userId, userId))
    .orderBy(asc(companies.name), asc(companies.id));
  if (userMemberships.length === 0) return { evaluations: [], licensesByCompany: new Map() };

  const companyIds = userMemberships.map(m => m.companyId);
  const [seats, poolLicenses] = await Promise.all([
    seatsOfUser(userId, productId),
    db
      .select({
        companyId: licenses.companyId,
        seatCount: licenses.seatCount,
        status: licenses.status,
        validFrom: licenses.validFrom,
        validUntil: licenses.validUntil,
      })
      .from(licenses)
      .where(and(eq(licenses.productId, productId), inArray(licenses.companyId, companyIds))),
  ]);

  const licensesByCompany = new Map<string, typeof poolLicenses>();
  for (const license of poolLicenses) {
    licensesByCompany.set(license.companyId, [...(licensesByCompany.get(license.companyId) ?? []), license]);
  }

  const evaluations: CompanyEvaluation[] = userMemberships.map(membership => {
    const seat = seats.find(s => s.companyId === membership.companyId);
    return {
      companyId: membership.companyId,
      companyName: membership.companyName,
      capacity: poolCapacity(licensesByCompany.get(membership.companyId) ?? [], now),
      employee: membership.employeeId
        ? {
            seat: !seat
              ? null
              : seat.status === 'waiting'
                ? { status: 'waiting', position: seat.ordinal }
                : { status: 'assigned', assignedAt: seat.assignedAt!, rank: seat.ordinal },
          }
        : null,
    };
  });
  return { evaluations, licensesByCompany };
}

export type MySoftwareRow = {
  companyId: string;
  companyName: string;
  productId: string;
  productName: string;
  productSlug: string;
  status: 'allowed' | 'waiting' | 'no_valid_license';
  position: number | null;
  validUntil: Date | null;
};

export async function getMySoftware(userId: string, now = new Date()) {
  const userMemberships = await db
    .select({ companyId: companies.id, companyName: companies.name, employeeId: employees.id })
    .from(memberships)
    .innerJoin(companies, and(eq(companies.id, memberships.companyId), isNull(companies.deletedAt)))
    .leftJoin(employees, eq(employees.membershipId, memberships.id))
    .where(eq(memberships.userId, userId))
    .orderBy(asc(companies.name));

  const linked = userMemberships.filter(m => m.employeeId);
  const rows: MySoftwareRow[] = [];
  if (linked.length > 0) {
    const openSeats = await db
      .selectDistinct({ productId: seatAssignments.productId, name: products.name, slug: products.slug })
      .from(seatAssignments)
      .innerJoin(products, eq(products.id, seatAssignments.productId))
      .where(
        and(
          inArray(
            seatAssignments.employeeId,
            linked.map(m => m.employeeId!),
          ),
          inArray(seatAssignments.status, ['waiting', 'assigned']),
        ),
      );
    for (const product of openSeats) {
      const { evaluations, licensesByCompany } = await loadEvaluations(userId, product.productId, now);
      for (const evaluation of evaluations) {
        const seat = evaluation.employee?.seat;
        if (!seat) continue;
        const companyLicenses = licensesByCompany.get(evaluation.companyId) ?? [];
        rows.push({
          companyId: evaluation.companyId,
          companyName: evaluation.companyName,
          productId: product.productId,
          productName: product.name,
          productSlug: product.slug,
          status:
            seat.status === 'waiting' ? 'waiting' : seat.rank <= evaluation.capacity ? 'allowed' : 'no_valid_license',
          position: seat.status === 'waiting' ? seat.position : null,
          validUntil: earliestExpiry(companyLicenses, now),
        });
      }
    }
  }
  rows.sort(
    (a, b) => a.productName.localeCompare(b.productName, 'hu') || a.companyName.localeCompare(b.companyName, 'hu'),
  );
  return {
    rows,
    unlinkedCompanies: userMemberships.filter(m => !m.employeeId).map(m => ({ id: m.companyId, name: m.companyName })),
  };
}

export async function listRecentChecks(companyId: string, limit = 100) {
  return db
    .select({
      id: licenseChecks.id,
      createdAt: licenseChecks.createdAt,
      allowed: licenseChecks.allowed,
      reason: licenseChecks.reason,
      productSlug: licenseChecks.productSlug,
      productName: products.name,
      userName: users.name,
      userEmail: users.email,
    })
    .from(licenseChecks)
    .leftJoin(products, eq(products.id, licenseChecks.productId))
    .leftJoin(users, eq(users.id, licenseChecks.userId))
    .where(eq(licenseChecks.companyId, companyId))
    .orderBy(desc(licenseChecks.id))
    .limit(limit);
}
