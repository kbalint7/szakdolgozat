import { and, asc, eq, gte, sql } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { licenses, orders, plans, products } from '@/db/schema';

export async function getSalesStatistics(now = new Date()) {
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const perProduct = await db
    .select({
      productId: products.id,
      productName: products.name,
      orders: sql<number>`count(${orders.id})`.mapWith(Number),
      manualOrders: sql<number>`count(${orders.id}) filter (where ${orders.source} = 'manual')`.mapWith(Number),
      revenueHuf: sql<number>`coalesce(sum(${orders.priceHuf}), 0)`.mapWith(Number),
      revenueLast30Huf:
        sql<number>`coalesce(sum(${orders.priceHuf}) filter (where ${orders.createdAt} >= ${since}), 0)`.mapWith(
          Number,
        ),
      seatsSold: sql<number>`coalesce(sum(${plans.seatCount}) filter (where ${orders.id} is not null), 0)`.mapWith(
        Number,
      ),
    })
    .from(products)
    .leftJoin(plans, eq(plans.productId, products.id))
    .leftJoin(orders, eq(orders.planId, plans.id))
    .groupBy(products.id)
    .orderBy(asc(products.name));

  const activeLicenses = await db
    .select({
      productId: licenses.productId,
      licenses: sql<number>`count(*)`.mapWith(Number),
      companies: sql<number>`count(distinct ${licenses.companyId})`.mapWith(Number),
      seats: sql<number>`sum(${licenses.seatCount})`.mapWith(Number),
    })
    .from(licenses)
    .where(
      and(
        eq(licenses.status, 'active'),
        sql`${licenses.validFrom} <= ${now}`,
        sql`(${licenses.validUntil} is null or ${licenses.validUntil} > ${now})`,
      ),
    )
    .groupBy(licenses.productId);

  const [recent] = await db
    .select({ value: sql<number>`count(*)`.mapWith(Number) })
    .from(orders)
    .where(gte(orders.createdAt, since));

  const rows = perProduct.map(product => {
    const active = activeLicenses.find(row => row.productId === product.productId);
    return {
      ...product,
      activeLicenses: active?.licenses ?? 0,
      activeCompanies: active?.companies ?? 0,
      activeSeats: active?.seats ?? 0,
    };
  });

  return {
    rows,
    totals: {
      orders: rows.reduce((sum, row) => sum + row.orders, 0),
      ordersLast30: recent.value,
      revenueHuf: rows.reduce((sum, row) => sum + row.revenueHuf, 0),
      revenueLast30Huf: rows.reduce((sum, row) => sum + row.revenueLast30Huf, 0),
      activeSeats: rows.reduce((sum, row) => sum + row.activeSeats, 0),
    },
  };
}
