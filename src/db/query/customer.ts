'use server';
import { eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { customers } from '../schema';

type Customer = typeof customers.$inferInsert;

export async function getAllCustomers(): Promise<Customer[]> {
	return await db.select().from(customers);
}

export async function getCustomer(id: number): Promise<Customer> {
	const result = await db.select().from(customers).where(eq(customers.id, id));
	return result[0];
}

export async function getCustomerByEmail(email: string): Promise<Customer> {
	const result = await db.select().from(customers).where(eq(customers.email, email));
	return result[0];
}

export async function addCustomer(customer: Customer): Promise<number> {
	const result = await db.insert(customers).values(customer).returning({ insertId: customers.id });
	return result[0].insertId;
}

export async function updateCustomer(id: number, customer: Customer): Promise<void> {
	await db.update(customers).set(customer).where(eq(customers.id, id));
}

export async function deleteCustomer(id: number): Promise<void> {
	await db.delete(customers).where(eq(customers.id, id));
}
