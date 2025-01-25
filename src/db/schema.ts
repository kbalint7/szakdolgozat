import { relations } from 'drizzle-orm';
import { pgTable, integer, varchar, timestamp, primaryKey } from 'drizzle-orm/pg-core';

export const customers = pgTable('customers', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	firstName: varchar('first_name', { length: 255 }).notNull(),
	lastName: varchar('last_name', { length: 255 }).notNull(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	password: varchar('password', { length: 255 }).notNull(),
	age: integer('age').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const products = pgTable('products', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	name: varchar('name', { length: 255 }).notNull().unique(),
	price: integer('price').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const ownerships = pgTable(
	'ownerships',
	{
		customerId: integer('customer_id')
			.notNull()
			.references(() => customers.id),
		productId: integer('product_id')
			.notNull()
			.references(() => products.id),
		createdAt: timestamp('created_at').notNull().defaultNow(),
	},
	t => [primaryKey({ columns: [t.customerId, t.productId] })]
);

export const customersRelations = relations(customers, ({ many }) => ({
	ownerships: many(ownerships),
}));

export const productsRelations = relations(products, ({ many }) => ({
	ownerships: many(ownerships),
}));

export const ownershipsRelations = relations(ownerships, ({ one }) => ({
	product: one(products, {
		fields: [ownerships.productId],
		references: [products.id],
	}),
	customer: one(customers, {
		fields: [ownerships.customerId],
		references: [customers.id],
	}),
}));
