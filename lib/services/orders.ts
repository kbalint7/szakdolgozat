import { and, desc, eq, isNull } from 'drizzle-orm';

import { db, type Tx } from '@/db/drizzle';
import { companies, licenseKeys, licenses, orders, plans, products, users, type License } from '@/db/schema';
import { generateLicenseKey, normalizeLicenseKey, sha256 } from '@/lib/crypto';
import { DomainError } from '@/lib/errors';

import { audit, type Actor } from './audit';
import { recomputePool, type PoolSummary } from './pools';

const DAY_MS = 24 * 60 * 60 * 1000;

async function lockPurchasablePlan(tx: Tx, planId: string) {
  const [row] = await tx
    .select({ plan: plans, product: { id: products.id, name: products.name, isPublished: products.isPublished } })
    .from(plans)
    .innerJoin(products, eq(products.id, plans.productId))
    .where(eq(plans.id, planId))
    .for('share', { of: plans });
  if (!row) throw new DomainError('PLAN_NOT_FOUND');
  return row;
}

async function createKey(tx: Tx, planId: string, orderId: string) {
  const key = generateLicenseKey();
  const [row] = await tx
    .insert(licenseKeys)
    .values({ orderId, planId, keyHash: sha256(key), keyLast4: key.slice(-4) })
    .returning({ id: licenseKeys.id });
  return { key, keyId: row.id };
}

export type PurchaseResult = {
  orderId: string;
  licenseKey: string;
  license?: License;
  pool?: PoolSummary;
};

export async function purchasePlan(
  actor: Actor & { type: 'user' },
  companyId: string,
  planId: string,
  options: { activate?: boolean; now?: Date } = {},
): Promise<PurchaseResult> {
  const now = options.now ?? new Date();
  return db.transaction(async tx => {
    const { plan, product } = await lockPurchasablePlan(tx, planId);
    if (!plan.isActive || !product.isPublished) throw new DomainError('PLAN_INACTIVE');

    const [order] = await tx
      .insert(orders)
      .values({ companyId, planId, placedBy: actor.id, priceHuf: plan.priceHuf, source: 'purchase' })
      .returning();
    const { key, keyId } = await createKey(tx, planId, order.id);
    await audit(tx, {
      companyId,
      actor,
      action: 'order.placed',
      targetType: 'order',
      targetId: order.id,
      data: { planId, productId: product.id, priceHuf: plan.priceHuf, licenseKeyId: keyId, keyLast4: key.slice(-4) },
    });

    if (!options.activate) return { orderId: order.id, licenseKey: key };
    const activation = await redeemKey(tx, actor, companyId, key, now);
    return { orderId: order.id, licenseKey: key, ...activation };
  });
}

export async function activateLicenseKey(actor: Actor, companyId: string, rawKey: string, now = new Date()) {
  return db.transaction(async tx => redeemKey(tx, actor, companyId, rawKey, now));
}

async function redeemKey(tx: Tx, actor: Actor, companyId: string, rawKey: string, now: Date) {
  const [key] = await tx
    .select()
    .from(licenseKeys)
    .where(eq(licenseKeys.keyHash, sha256(normalizeLicenseKey(rawKey))))
    .for('update');
  if (!key) throw new DomainError('LICENSE_KEY_UNKNOWN');
  if (key.status === 'redeemed') throw new DomainError('LICENSE_KEY_USED');
  if (key.status === 'revoked') throw new DomainError('LICENSE_KEY_REVOKED');

  const [company] = await tx
    .select({ id: companies.id })
    .from(companies)
    .where(and(eq(companies.id, companyId), isNull(companies.deletedAt)));
  if (!company) throw new DomainError('COMPANY_NOT_FOUND');

  const [plan] = await tx.select().from(plans).where(eq(plans.id, key.planId));
  const [license] = await tx
    .insert(licenses)
    .values({
      companyId,
      productId: plan.productId,
      planId: plan.id,
      licenseKeyId: key.id,
      seatCount: plan.seatCount,
      validFrom: now,
      validUntil: plan.durationDays === null ? null : new Date(now.getTime() + plan.durationDays * DAY_MS),
    })
    .returning();
  await tx
    .update(licenseKeys)
    .set({
      status: 'redeemed',
      redeemedCompanyId: companyId,
      redeemedBy: actor.type === 'user' ? actor.id : null,
      redeemedAt: now,
    })
    .where(eq(licenseKeys.id, key.id));
  await audit(tx, {
    companyId,
    actor,
    action: 'license.activated',
    targetType: 'license',
    targetId: license.id,
    reason: 'CAPACITY_ADDED',
    data: {
      productId: plan.productId,
      planId: plan.id,
      seatCount: license.seatCount,
      validUntil: license.validUntil?.toISOString() ?? null,
      keyLast4: key.keyLast4,
    },
  });

  const pool = await recomputePool(tx, { companyId, productId: plan.productId, now, cause: { actor } });
  return { license, pool };
}

export async function listCompanyLicenses(companyId: string) {
  return db
    .select({
      id: licenses.id,
      productId: licenses.productId,
      productName: products.name,
      planName: plans.name,
      seatCount: licenses.seatCount,
      validFrom: licenses.validFrom,
      validUntil: licenses.validUntil,
      status: licenses.status,
      createdAt: licenses.createdAt,
      orderId: orders.id,
      orderSource: orders.source,
      orderCreatedAt: orders.createdAt,
      keyLast4: licenseKeys.keyLast4,
    })
    .from(licenses)
    .innerJoin(products, eq(products.id, licenses.productId))
    .innerJoin(plans, eq(plans.id, licenses.planId))
    .innerJoin(licenseKeys, eq(licenseKeys.id, licenses.licenseKeyId))
    .leftJoin(orders, eq(orders.id, licenseKeys.orderId))
    .where(eq(licenses.companyId, companyId))
    .orderBy(desc(licenses.createdAt));
}

export async function listCompanyOrders(companyId: string) {
  return db
    .select({
      id: orders.id,
      createdAt: orders.createdAt,
      priceHuf: orders.priceHuf,
      productName: products.name,
      planName: plans.name,
      keyLast4: licenseKeys.keyLast4,
      keyStatus: licenseKeys.status,
      placedBy: users.name,
    })
    .from(orders)
    .innerJoin(plans, eq(plans.id, orders.planId))
    .innerJoin(products, eq(products.id, plans.productId))
    .leftJoin(licenseKeys, eq(licenseKeys.orderId, orders.id))
    .leftJoin(users, eq(users.id, orders.placedBy))
    .where(eq(orders.companyId, companyId))
    .orderBy(desc(orders.createdAt));
}

export async function getPurchasablePlan(planId: string) {
  const [row] = await db
    .select({
      id: plans.id,
      name: plans.name,
      seatCount: plans.seatCount,
      durationDays: plans.durationDays,
      priceHuf: plans.priceHuf,
      isActive: plans.isActive,
      product: { id: products.id, name: products.name, slug: products.slug, isPublished: products.isPublished },
    })
    .from(plans)
    .innerJoin(products, eq(products.id, plans.productId))
    .where(eq(plans.id, planId));
  if (!row || !row.isActive || !row.product.isPublished) return null;
  return row;
}
