import { and, asc, count, eq, min, sql } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { plans, products, type Plan, type Product } from '@/db/schema';
import { DomainError, isUniqueViolation } from '@/lib/errors';
import type { PlanInput, ProductInput } from '@/lib/validation/catalog';

import { audit, type Actor } from './audit';

export type CatalogProduct = Pick<Product, 'id' | 'slug' | 'name' | 'summary'> & {
  lowestPriceHuf: number | null;
  planCount: number;
};

export async function listPublishedProducts(): Promise<CatalogProduct[]> {
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      summary: products.summary,
      lowestPriceHuf: min(plans.priceHuf),
      planCount: count(plans.id),
    })
    .from(products)
    .leftJoin(plans, and(eq(plans.productId, products.id), eq(plans.isActive, true)))
    .where(eq(products.isPublished, true))
    .groupBy(products.id)
    .orderBy(asc(products.name));
  return rows;
}

export type ProductWithPlans = Product & { plans: Plan[] };

export async function getPublishedProduct(slug: string): Promise<ProductWithPlans | null> {
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.isPublished, true)),
  });
  if (!product) return null;
  const activePlans = await db
    .select()
    .from(plans)
    .where(and(eq(plans.productId, product.id), eq(plans.isActive, true)))
    .orderBy(asc(plans.priceHuf));
  return { ...product, plans: activePlans };
}

export async function listProductsForAdmin() {
  return db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      isPublished: products.isPublished,
      updatedAt: products.updatedAt,
      planCount: count(plans.id),
      activePlanCount: sql<number>`count(${plans.id}) filter (where ${plans.isActive})`.mapWith(Number),
    })
    .from(products)
    .leftJoin(plans, eq(plans.productId, products.id))
    .groupBy(products.id)
    .orderBy(asc(products.name));
}

export async function getProductForAdmin(productId: string): Promise<ProductWithPlans | null> {
  const product = await db.query.products.findFirst({ where: eq(products.id, productId) });
  if (!product) return null;
  const productPlans = await db
    .select()
    .from(plans)
    .where(eq(plans.productId, productId))
    .orderBy(asc(plans.createdAt));
  return { ...product, plans: productPlans };
}

export async function createProduct(actor: Actor, input: ProductInput): Promise<Product> {
  try {
    return await db.transaction(async tx => {
      const [product] = await tx.insert(products).values(input).returning();
      await audit(tx, {
        actor,
        action: 'product.created',
        targetType: 'product',
        targetId: product.id,
        data: { slug: product.slug, name: product.name },
      });
      return product;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new DomainError('PRODUCT_SLUG_TAKEN');
    throw error;
  }
}

export async function updateProduct(actor: Actor, productId: string, input: ProductInput): Promise<Product> {
  try {
    return await db.transaction(async tx => {
      const [product] = await tx.update(products).set(input).where(eq(products.id, productId)).returning();
      if (!product) throw new DomainError('PRODUCT_NOT_FOUND');
      await audit(tx, {
        actor,
        action: 'product.updated',
        targetType: 'product',
        targetId: product.id,
        data: { ...input },
      });
      return product;
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new DomainError('PRODUCT_SLUG_TAKEN');
    throw error;
  }
}

export async function setProductPublished(actor: Actor, productId: string, isPublished: boolean) {
  return db.transaction(async tx => {
    const [product] = await tx
      .update(products)
      .set({ isPublished })
      .where(eq(products.id, productId))
      .returning({ id: products.id });
    if (!product) throw new DomainError('PRODUCT_NOT_FOUND');
    await audit(tx, {
      actor,
      action: isPublished ? 'product.published' : 'product.unpublished',
      targetType: 'product',
      targetId: productId,
    });
  });
}

export async function createPlan(actor: Actor, productId: string, input: PlanInput): Promise<Plan> {
  return db.transaction(async tx => {
    const product = await tx.query.products.findFirst({ where: eq(products.id, productId) });
    if (!product) throw new DomainError('PRODUCT_NOT_FOUND');
    const [plan] = await tx
      .insert(plans)
      .values({ ...input, productId })
      .returning();
    await audit(tx, {
      actor,
      action: 'plan.created',
      targetType: 'plan',
      targetId: plan.id,
      data: { productId, ...input },
    });
    return plan;
  });
}

export async function updatePlan(actor: Actor, planId: string, input: PlanInput): Promise<Plan> {
  return db.transaction(async tx => {
    const [plan] = await tx.update(plans).set(input).where(eq(plans.id, planId)).returning();
    if (!plan) throw new DomainError('PLAN_NOT_FOUND');
    await audit(tx, {
      actor,
      action: 'plan.updated',
      targetType: 'plan',
      targetId: plan.id,
      data: { productId: plan.productId, ...input },
    });
    return plan;
  });
}

export async function setPlanActive(actor: Actor, planId: string, isActive: boolean) {
  return db.transaction(async tx => {
    const [plan] = await tx
      .update(plans)
      .set({ isActive })
      .where(eq(plans.id, planId))
      .returning({ id: plans.id, productId: plans.productId });
    if (!plan) throw new DomainError('PLAN_NOT_FOUND');
    await audit(tx, {
      actor,
      action: isActive ? 'plan.activated' : 'plan.deactivated',
      targetType: 'plan',
      targetId: planId,
      data: { productId: plan.productId },
    });
  });
}
