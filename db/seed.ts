import '../scripts/load-env';

import { randomUUID } from 'node:crypto';

import { hashPassword } from 'better-auth/crypto';
import { and, eq } from 'drizzle-orm';

import { db, pool } from '@/db/drizzle';
import {
  accounts,
  apiKeys,
  companies,
  employees,
  entitlementRules,
  licenses,
  memberships,
  plans,
  products,
  users,
} from '@/db/schema';
import { audit, type Actor } from '@/lib/services/audit';
import { createApiKey } from '@/lib/services/api-keys';
import { createProduct, createPlan, setProductPublished } from '@/lib/services/catalog';
import { createCompany } from '@/lib/services/companies';
import { ingestEvent, processEvent } from '@/lib/services/hr-events';
import { acceptInvitation, regenerateInvitationLink } from '@/lib/services/invitations';
import { purchasePlan } from '@/lib/services/orders';
import { createRule } from '@/lib/services/rules';

export const DEMO_PASSWORD = 'Demo1234';
export const ADMIN_PASSWORD = 'Admin1234';

const log = (message: string) => console.log(`[seed] ${message}`);

async function ensureUser(input: { email: string; name: string; password: string; isPlatformAdmin?: boolean }) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, input.email) });
  if (existing) return existing;
  const id = randomUUID();
  const [user] = await db
    .insert(users)
    .values({
      id,
      email: input.email,
      name: input.name,
      emailVerified: true,
      isPlatformAdmin: input.isPlatformAdmin ?? false,
    })
    .returning();
  await db.insert(accounts).values({
    id: randomUUID(),
    accountId: id,
    providerId: 'credential',
    userId: id,
    password: await hashPassword(input.password),
  });
  log(`user ${input.email}`);
  return user;
}

async function ensureProduct(
  actor: Actor & { type: 'user' },
  input: {
    slug: string;
    name: string;
    summary: string;
    description: string;
    plans: { name: string; seatCount: number; durationDays: number | null; priceHuf: number }[];
  },
) {
  let product = await db.query.products.findFirst({ where: eq(products.slug, input.slug) });
  if (!product) {
    product = await createProduct(actor, {
      slug: input.slug,
      name: input.name,
      summary: input.summary,
      description: input.description,
    });
    await setProductPublished(actor, product.id, true);
    log(`product ${input.slug}`);
  }
  for (const plan of input.plans) {
    const existing = await db.query.plans.findFirst({
      where: and(eq(plans.productId, product.id), eq(plans.name, plan.name)),
    });
    if (!existing) await createPlan(actor, product.id, { ...plan, isActive: true });
  }
  return product;
}

async function ensureCompany(owner: { id: string }, name: string, description: string) {
  const existing = await db.query.companies.findFirst({ where: eq(companies.name, name) });
  if (existing) return existing;
  log(`company ${name}`);
  return createCompany(owner.id, { name, description });
}

async function ensureMembership(companyId: string, userId: string, role: 'admin' | 'member') {
  const existing = await db.query.memberships.findFirst({
    where: and(eq(memberships.companyId, companyId), eq(memberships.userId, userId)),
  });
  if (existing) return existing;
  const [membership] = await db.insert(memberships).values({ companyId, userId, role }).returning();
  await audit(db, {
    companyId,
    actor: { type: 'system', id: 'seed' },
    action: 'membership.created',
    targetType: 'membership',
    targetId: membership.id,
    data: { userId, role, via: 'seed' },
  });
  return membership;
}

async function ensureLicense(
  actor: Actor & { type: 'user' },
  companyId: string,
  productSlug: string,
  planName: string,
) {
  const product = await db.query.products.findFirst({ where: eq(products.slug, productSlug) });
  const existing = await db.query.licenses.findFirst({
    where: and(eq(licenses.companyId, companyId), eq(licenses.productId, product!.id)),
  });
  if (existing) return;
  const plan = await db.query.plans.findFirst({
    where: and(eq(plans.productId, product!.id), eq(plans.name, planName)),
  });
  await purchasePlan(actor, companyId, plan!.id, { activate: true });
  log(`licence ${productSlug} (${plan!.seatCount} seats) for company ${companyId}`);
}

async function ensureRule(actor: Actor & { type: 'user' }, companyId: string, jobRole: string, productSlug: string) {
  const product = await db.query.products.findFirst({ where: eq(products.slug, productSlug) });
  const existing = await db.query.entitlementRules.findFirst({
    where: and(
      eq(entitlementRules.companyId, companyId),
      eq(entitlementRules.productId, product!.id),
      eq(entitlementRules.jobRole, jobRole),
    ),
  });
  if (!existing) await createRule(actor, companyId, { jobRole, productId: product!.id });
}

async function ensureApiKey(actor: Actor & { type: 'user' }, companyId: string, name: string) {
  const existing = await db.query.apiKeys.findFirst({
    where: and(eq(apiKeys.companyId, companyId), eq(apiKeys.name, name)),
  });
  if (existing) return existing.id;
  const created = await createApiKey(actor, companyId, { name, scopes: ['hr:events:write', 'hr:events:read'] });
  log(`API key ${name}`);
  return created.id;
}

type SeedEmployee = { hrId: string; name: string; jobRole: string; email?: string };

async function hire(companyId: string, apiKeyId: string, list: SeedEmployee[], startIso: string) {
  const start = new Date(startIso).getTime();
  let created = 0;
  for (const [index, employee] of list.entries()) {
    const result = await ingestEvent(
      { companyId, source: 'api', apiKeyId },
      {
        eventId: `seed-${employee.hrId}-hired`,
        type: 'employee.hired',
        occurredAt: new Date(start + index * 60_000).toISOString(),
        employee,
      },
    );
    if (result.status === 'accepted') {
      await processEvent(result.id);
      created++;
    }
  }
  if (created) log(`${created} employees hired in company ${companyId}`);
}

const developerNames = [
  'Kiss Anna',
  'Nagy Bence',
  'Tóth Csilla',
  'Szabó Dániel',
  'Horváth Eszter',
  'Varga Ferenc',
  'Kovács Gréta',
  'Molnár Hunor',
  'Németh Ilona',
  'Farkas János',
  'Balogh Kata',
  'Papp Levente',
  'Takács Mira',
  'Juhász Norbert',
  'Lakatos Olga',
  'Mészáros Péter',
  'Oláh Réka',
  'Simon Sándor',
  'Rácz Tímea',
  'Fekete Vilmos',
];

const pelda: SeedEmployee[] = [
  ...developerNames.map((name, i) => ({
    hrId: `E-${1001 + i}`,
    name,
    jobRole: 'developer',
    ...(i === 0 ? { email: 'anna.kiss@pelda.test' } : {}),
  })),
  { hrId: 'E-1021', name: 'Bíró Zita', jobRole: 'designer' },
  { hrId: 'E-1022', name: 'Vass Ádám', jobRole: 'designer' },
  { hrId: 'E-1023', name: 'Pintér Lili', jobRole: 'designer' },
  { hrId: 'E-1024', name: 'Szűcs Márton', jobRole: 'accountant' },
  { hrId: 'E-1025', name: 'Halász Nóra', jobRole: 'accountant' },
];

const masik: SeedEmployee[] = [
  { hrId: 'M-001', name: 'Fazekas Bálint', jobRole: 'designer' },
  { hrId: 'M-002', name: 'Gulyás Emese', jobRole: 'designer' },
  { hrId: 'M-003', name: 'Hajdú Imre', jobRole: 'developer' },
];

async function main() {
  const admin = await ensureUser({
    email: 'admin@licenckezelo.test',
    name: 'Platform Admin',
    password: ADMIN_PASSWORD,
    isPlatformAdmin: true,
  });
  const adminActor = { type: 'user' as const, id: admin.id };
  await ensureProduct(adminActor, {
    slug: 'ide-pro',
    name: 'IDE Pro',
    summary: 'Professzionális fejlesztőkörnyezet csapatoknak.',
    description: 'Kódszerkesztő, hibakereső és refaktoráló eszközök egy helyen. A fejlesztői munkakörökhöz.',
    plans: [
      { name: 'Csapat – 5 hely, 12 hónap', seatCount: 5, durationDays: 365, priceHuf: 150_000 },
      { name: 'Részleg – 20 hely, 12 hónap', seatCount: 20, durationDays: 365, priceHuf: 540_000 },
      { name: 'Vállalat – 50 hely, határozatlan', seatCount: 50, durationDays: null, priceHuf: 2_900_000 },
    ],
  });
  await ensureProduct(adminActor, {
    slug: 'office-suite',
    name: 'Office Suite',
    summary: 'Irodai programcsomag: szövegszerkesztő, táblázatkezelő, bemutató.',
    description: 'Az irodai munkakörök alapcsomagja.',
    plans: [
      { name: 'Alap – 10 hely, 12 hónap', seatCount: 10, durationDays: 365, priceHuf: 90_000 },
      { name: 'Bővített – 25 hely, 24 hónap', seatCount: 25, durationDays: 730, priceHuf: 380_000 },
    ],
  });

  const owner = await ensureUser({ email: 'tulajdonos@pelda.test', name: 'Példa Tulajdonos', password: DEMO_PASSWORD });
  const peldaAdmin = await ensureUser({ email: 'admin@pelda.test', name: 'Példa Admin', password: DEMO_PASSWORD });
  const anna = await ensureUser({ email: 'anna.kiss@pelda.test', name: 'Kiss Anna', password: DEMO_PASSWORD });
  const company = await ensureCompany(owner, 'Példa Kft.', 'Szoftverfejlesztő cég a bemutatóhoz.');
  const ownerActor = { type: 'user' as const, id: owner.id };
  await ensureMembership(company.id, peldaAdmin.id, 'admin');

  await ensureRule(ownerActor, company.id, 'developer', 'ide-pro');
  await ensureLicense(ownerActor, company.id, 'ide-pro', 'Részleg – 20 hely, 12 hónap');

  const apiKeyId = await ensureApiKey(ownerActor, company.id, 'HR-rendszer');
  await hire(company.id, apiKeyId, pelda, '2026-09-01T07:00:00Z');

  const annaEmployee = await db.query.employees.findFirst({
    where: and(eq(employees.companyId, company.id), eq(employees.hrId, 'E-1001')),
  });
  if (annaEmployee && !annaEmployee.membershipId) {
    const invitation = await db.query.invitations.findFirst({
      where: (inv, { and: both, eq: same, isNull }) =>
        both(same(inv.companyId, company.id), same(inv.email, 'anna.kiss@pelda.test'), isNull(inv.acceptedAt)),
    });
    if (invitation) {
      const { token } = await regenerateInvitationLink(ownerActor, company.id, invitation.id);
      await acceptInvitation(anna, token);
      log('anna.kiss@pelda.test accepted her invitation');
    }
  }

  const otherOwner = await ensureUser({
    email: 'tulajdonos@masik.test',
    name: 'Másik Tulajdonos',
    password: DEMO_PASSWORD,
  });
  const other = await ensureCompany(otherOwner, 'Másik Zrt.', 'Második cég a bemutatóhoz.');
  const otherActor = { type: 'user' as const, id: otherOwner.id };
  await ensureRule(otherActor, other.id, 'designer', 'office-suite');
  await ensureLicense(otherActor, other.id, 'office-suite', 'Alap – 10 hely, 12 hónap');
  const otherApiKeyId = await ensureApiKey(otherActor, other.id, 'HR-rendszer');
  await hire(other.id, otherApiKeyId, masik, '2026-09-01T07:00:00Z');

  log('done');
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
