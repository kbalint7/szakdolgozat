import { randomUUID } from 'node:crypto';

import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { employees, licenses, seatAssignments, users } from '@/db/schema';
import type { HrEventInput } from '@/lib/domain/hr-events';
import { createApiKey } from '@/lib/services/api-keys';
import { createPlan, createProduct, setProductPublished } from '@/lib/services/catalog';
import { createClientToken } from '@/lib/services/client-tokens';
import { createCompany } from '@/lib/services/companies';
import { ingestEvent, processEvent, type ProcessOptions } from '@/lib/services/hr-events';
import { linkMemberToEmployee } from '@/lib/services/invitations';
import { checkLicense } from '@/lib/services/license-check';
import { purchasePlan } from '@/lib/services/orders';
import { createRule } from '@/lib/services/rules';

let counter = 0;
const unique = (prefix: string) => `${prefix}-${++counter}-${randomUUID().slice(0, 8)}`;

export async function createUser(name = 'Teszt Felhasználó') {
  const id = randomUUID();
  const [user] = await db
    .insert(users)
    .values({ id, name, email: `${unique('user')}@example.test`, emailVerified: true })
    .returning();
  return user;
}

export async function createProductWithPlan(seatCount: number, options: { durationDays?: number | null } = {}) {
  const admin = await createUser('Platform Admin');
  const actor = { type: 'user' as const, id: admin.id };
  const product = await createProduct(actor, {
    slug: unique('product'),
    name: 'IDE Pro',
    summary: '',
    description: '',
  });
  await setProductPublished(actor, product.id, true);
  const plan = await createPlan(actor, product.id, {
    name: `${seatCount} hely`,
    seatCount,
    durationDays: options.durationDays === undefined ? 365 : options.durationDays,
    priceHuf: 1000,
    isActive: true,
  });
  return { product, plan, admin };
}

export type TestCompany = Awaited<ReturnType<typeof createTestCompany>>;

export async function createTestCompany(name = 'Példa Kft.') {
  const owner = await createUser('Tulajdonos');
  const company = await createCompany(owner.id, { name, description: '' });
  const ownerActor = { type: 'user' as const, id: owner.id };
  const apiKey = await createApiKey(ownerActor, company.id, {
    name: 'test',
    scopes: ['hr:events:write', 'hr:events:read'],
  });
  let minute = 0;
  const base = Date.UTC(2026, 10, 3, 9, 0);
  const nextTime = () => new Date(base + minute++ * 60_000).toISOString();

  async function send(
    type: HrEventInput['type'],
    hrId: string,
    extra: { jobRole?: string; email?: string; occurredAt?: string; eventId?: string } = {},
    options?: ProcessOptions,
  ) {
    const event: HrEventInput = {
      eventId: extra.eventId ?? unique('evt'),
      type,
      occurredAt: extra.occurredAt ?? nextTime(),
      employee: {
        hrId,
        ...(extra.jobRole ? { jobRole: extra.jobRole } : {}),
        ...(extra.email ? { email: extra.email } : {}),
      },
    };
    const ingested = await ingestEvent({ companyId: company.id, source: 'api', apiKeyId: apiKey.id }, event);
    const processed = ingested.status === 'accepted' ? await processEvent(ingested.id, options) : null;
    return { event, ingested, processed };
  }

  return {
    company,
    owner,
    ownerActor,
    apiKey,
    nextTime,
    send,
    hire: (hrId: string, jobRole = 'developer', extra: { occurredAt?: string; email?: string } = {}) =>
      send('employee.hired', hrId, { jobRole, ...extra }),
    terminate: (hrId: string, extra: { occurredAt?: string } = {}, options?: ProcessOptions) =>
      send('employee.terminated', hrId, extra, options),
    changeRole: (hrId: string, jobRole: string) => send('employee.role_changed', hrId, { jobRole }),
    rule: (jobRole: string, productId: string) => createRule(ownerActor, company.id, { jobRole, productId }),
    license: (planId: string, now?: Date) => purchasePlan(ownerActor, company.id, planId, { activate: true, now }),
  };
}

export async function employeeByHrId(companyId: string, hrId: string) {
  const [employee] = await db
    .select()
    .from(employees)
    .where(and(eq(employees.companyId, companyId), eq(employees.hrId, hrId)));
  return employee;
}

export async function poolState(companyId: string, productId: string) {
  const rows = await db
    .select({ hrId: employees.hrId, status: seatAssignments.status, eligibleSince: seatAssignments.eligibleSince })
    .from(seatAssignments)
    .innerJoin(employees, eq(employees.id, seatAssignments.employeeId))
    .where(
      and(
        eq(seatAssignments.companyId, companyId),
        eq(seatAssignments.productId, productId),
        inArray(seatAssignments.status, ['waiting', 'assigned']),
      ),
    );
  const assigned = rows
    .filter(r => r.status === 'assigned')
    .map(r => r.hrId)
    .sort();
  const waiting = rows
    .filter(r => r.status === 'waiting')
    .map(r => r.hrId)
    .sort();
  return { assigned, waiting, rows };
}

export async function seatHistory(employeeId: string) {
  return db
    .select()
    .from(seatAssignments)
    .where(eq(seatAssignments.employeeId, employeeId))
    .orderBy(seatAssignments.createdAt);
}

export async function linkedUser(test: TestCompany, hrId: string) {
  const user = await createUser(hrId);
  const { memberships } = await import('@/db/schema');
  const [membership] = await db
    .insert(memberships)
    .values({ companyId: test.company.id, userId: user.id, role: 'member' })
    .returning();
  const employee = await employeeByHrId(test.company.id, hrId);
  await linkMemberToEmployee(test.ownerActor, test.company.id, employee.id, membership.id);
  const token = await createClientToken(user.id, 'test');
  return { user, membership, token, check: (slug: string, now?: Date) => checkLicense({ userId: user.id }, slug, now) };
}

export async function expireAllLicenses(companyId: string, at: Date) {
  await db.update(licenses).set({ validUntil: at }).where(eq(licenses.companyId, companyId));
}
