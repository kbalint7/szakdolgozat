import { and, asc, eq, inArray, isNull, or, sql } from 'drizzle-orm';

import { db, type Tx } from '@/db/drizzle';
import { companies, employees, entitlementRules, licenses, products, seatAssignments } from '@/db/schema';
import { DomainError, isUniqueViolation } from '@/lib/errors';
import type { RuleInput } from '@/lib/validation/rules';

import { audit, type Actor } from './audit';
import { recomputePool } from './pools';

async function lockCompanyExclusive(tx: Tx, companyId: string) {
  const [company] = await tx
    .select({ id: companies.id })
    .from(companies)
    .where(and(eq(companies.id, companyId), isNull(companies.deletedAt)))
    .for('update');
  if (!company) throw new DomainError('COMPANY_NOT_FOUND');
}

export async function listRulesWithImpact(companyId: string) {
  const eligible = db
    .select({ jobRole: employees.jobRole, value: sql<number>`count(*)`.as('eligible_count') })
    .from(employees)
    .where(and(eq(employees.companyId, companyId), eq(employees.status, 'active')))
    .groupBy(employees.jobRole)
    .as('eligible');

  const seats = db
    .select({
      productId: seatAssignments.productId,
      jobRole: employees.jobRole,
      assigned: sql<number>`count(*) filter (where ${seatAssignments.status} = 'assigned')`.as('assigned_count'),
      waiting: sql<number>`count(*) filter (where ${seatAssignments.status} = 'waiting')`.as('waiting_count'),
    })
    .from(seatAssignments)
    .innerJoin(employees, eq(employees.id, seatAssignments.employeeId))
    .where(and(eq(seatAssignments.companyId, companyId), inArray(seatAssignments.status, ['waiting', 'assigned'])))
    .groupBy(seatAssignments.productId, employees.jobRole)
    .as('seats');

  return db
    .select({
      id: entitlementRules.id,
      jobRole: entitlementRules.jobRole,
      createdAt: entitlementRules.createdAt,
      product: { id: products.id, name: products.name },
      eligible: sql<number>`coalesce(${eligible.value}, 0)`.mapWith(Number),
      assigned: sql<number>`coalesce(${seats.assigned}, 0)`.mapWith(Number),
      waiting: sql<number>`coalesce(${seats.waiting}, 0)`.mapWith(Number),
    })
    .from(entitlementRules)
    .innerJoin(products, eq(products.id, entitlementRules.productId))
    .leftJoin(eligible, eq(eligible.jobRole, entitlementRules.jobRole))
    .leftJoin(seats, and(eq(seats.productId, entitlementRules.productId), eq(seats.jobRole, entitlementRules.jobRole)))
    .where(eq(entitlementRules.companyId, companyId))
    .orderBy(asc(products.name), asc(entitlementRules.jobRole));
}

export async function listRuleProducts(companyId: string) {
  return db
    .selectDistinct({ id: products.id, name: products.name })
    .from(products)
    .leftJoin(licenses, and(eq(licenses.productId, products.id), eq(licenses.companyId, companyId)))
    .where(or(eq(products.isPublished, true), sql`${licenses.id} is not null`))
    .orderBy(asc(products.name));
}

export async function listKnownJobRoles(companyId: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ jobRole: employees.jobRole })
    .from(employees)
    .where(eq(employees.companyId, companyId))
    .orderBy(asc(employees.jobRole));
  return rows.map(row => row.jobRole);
}

export async function createRule(actor: Actor & { type: 'user' }, companyId: string, input: RuleInput) {
  const now = new Date();
  try {
    return await db.transaction(async tx => {
      await lockCompanyExclusive(tx, companyId);
      const [product] = await tx.select({ id: products.id }).from(products).where(eq(products.id, input.productId));
      if (!product) throw new DomainError('PRODUCT_NOT_FOUND');

      const [rule] = await tx
        .insert(entitlementRules)
        .values({ companyId, productId: input.productId, jobRole: input.jobRole, createdBy: actor.id, createdAt: now })
        .returning();
      await audit(tx, {
        companyId,
        actor,
        action: 'rule.created',
        targetType: 'entitlement_rule',
        targetId: rule.id,
        data: { jobRole: rule.jobRole, productId: rule.productId },
      });
      const pool = await recomputePool(tx, {
        companyId,
        productId: rule.productId,
        now,
        cause: { actor, ruleId: rule.id },
        eligibleSinceFor: () => rule.createdAt,
      });
      return { rule, pool };
    });
  } catch (error) {
    if (isUniqueViolation(error, 'entitlement_rules_unique')) throw new DomainError('RULE_EXISTS');
    throw error;
  }
}

export async function deleteRule(actor: Actor, companyId: string, ruleId: string) {
  const now = new Date();
  return db.transaction(async tx => {
    await lockCompanyExclusive(tx, companyId);
    const [rule] = await tx
      .delete(entitlementRules)
      .where(and(eq(entitlementRules.id, ruleId), eq(entitlementRules.companyId, companyId)))
      .returning();
    if (!rule) throw new DomainError('RULE_NOT_FOUND');
    await audit(tx, {
      companyId,
      actor,
      action: 'rule.deleted',
      targetType: 'entitlement_rule',
      targetId: rule.id,
      data: { jobRole: rule.jobRole, productId: rule.productId },
    });
    const pool = await recomputePool(tx, {
      companyId,
      productId: rule.productId,
      now,
      cause: { actor, ruleId: rule.id },
      reasonFor: employee =>
        employee.status === 'terminated'
          ? 'EMPLOYEE_TERMINATED'
          : employee.jobRole === rule.jobRole
            ? 'RULE_REMOVED'
            : 'ROLE_NO_LONGER_ELIGIBLE',
    });
    return { rule, pool };
  });
}
