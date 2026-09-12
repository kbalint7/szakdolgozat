import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  isPlatformAdmin: boolean('is_platform_admin').default(false).notNull(),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
  updatedAt: timestamptz('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamptz('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
    updatedAt: timestamptz('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  t => [index('sessions_user_id_idx').on(t.userId)],
);

export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamptz('access_token_expires_at'),
    refreshTokenExpiresAt: timestamptz('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
    updatedAt: timestamptz('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  t => [index('accounts_user_id_idx').on(t.userId)],
);

export const verifications = pgTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamptz('expires_at').notNull(),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
    updatedAt: timestamptz('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  t => [index('verifications_identifier_idx').on(t.identifier)],
);

export const membershipRole = pgEnum('membership_role', ['owner', 'admin', 'member']);
export const orderSource = pgEnum('order_source', ['purchase', 'manual']);
export const licenseKeyStatus = pgEnum('license_key_status', ['unredeemed', 'redeemed', 'revoked']);
export const licenseStatus = pgEnum('license_status', ['active', 'revoked']);
export const employeeStatus = pgEnum('employee_status', ['active', 'terminated']);
export const seatStatus = pgEnum('seat_status', ['waiting', 'assigned', 'revoked', 'cancelled']);
export const hrEventType = pgEnum('hr_event_type', ['employee.hired', 'employee.role_changed', 'employee.terminated']);
export const hrEventSource = pgEnum('hr_event_source', ['api', 'ui']);
export const hrEventStatus = pgEnum('hr_event_status', ['pending', 'processed', 'stale', 'failed']);
export const actorType = pgEnum('actor_type', ['user', 'api_key', 'system']);

export const seatReason = pgEnum('seat_reason', [
  'EMPLOYEE_TERMINATED',
  'ROLE_NO_LONGER_ELIGIBLE',
  'RULE_REMOVED',
  'CAPACITY_REDUCED',
  'LICENSE_EXPIRED',
  'COMPANY_DELETED',
  'RULE_MATCHED',
  'SEAT_FREED',
  'CAPACITY_ADDED',
]);

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  summary: text('summary').notNull().default(''),
  description: text('description').notNull().default(''),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
  updatedAt: timestamptz('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const plans = pgTable(
  'plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    seatCount: integer('seat_count').notNull(),
    durationDays: integer('duration_days'),
    priceHuf: integer('price_huf').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
    updatedAt: timestamptz('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  t => [
    index('plans_product_id_idx').on(t.productId),
    check('plans_seat_count_positive', sql`${t.seatCount} > 0`),
    check('plans_duration_positive', sql`${t.durationDays} IS NULL OR ${t.durationDays} > 0`),
    check('plans_price_non_negative', sql`${t.priceHuf} >= 0`),
  ],
);

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
  updatedAt: timestamptz('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  deletedAt: timestamptz('deleted_at'),
});

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: membershipRole('role').notNull(),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
  },
  t => [
    unique('memberships_company_user_unique').on(t.companyId, t.userId),
    uniqueIndex('memberships_one_owner_per_company')
      .on(t.companyId)
      .where(sql`${t.role} = 'owner'`),
    index('memberships_user_id_idx').on(t.userId),
  ],
);

export const employees = pgTable(
  'employees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    hrId: text('hr_id').notNull(),
    email: text('email'),
    name: text('name'),
    jobRole: text('job_role').notNull(),
    status: employeeStatus('status').notNull(),
    stateAsOf: timestamptz('state_as_of').notNull(),
    lastEventId: text('last_event_id'),
    membershipId: uuid('membership_id')
      .unique()
      .references(() => memberships.id, { onDelete: 'set null' }),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
    updatedAt: timestamptz('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  t => [
    unique('employees_company_hr_id_unique').on(t.companyId, t.hrId),
    index('employees_company_job_role_idx').on(t.companyId, t.jobRole, t.status),
  ],
);

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: membershipRole('role').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'set null' }),
    invitedBy: text('invited_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
    expiresAt: timestamptz('expires_at').notNull(),
    acceptedAt: timestamptz('accepted_at'),
    acceptedBy: text('accepted_by').references(() => users.id, { onDelete: 'set null' }),
    declinedAt: timestamptz('declined_at'),
    revokedAt: timestamptz('revoked_at'),
  },
  t => [
    index('invitations_company_id_idx').on(t.companyId),
    check('invitations_role_not_owner', sql`${t.role} <> 'owner'`),
  ],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id, { onDelete: 'restrict' }),
    placedBy: text('placed_by').references(() => users.id, { onDelete: 'set null' }),
    priceHuf: integer('price_huf').notNull(),
    source: orderSource('source').notNull(),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
  },
  t => [index('orders_company_id_idx').on(t.companyId), index('orders_created_at_idx').on(t.createdAt)],
);

export const licenseKeys = pgTable('license_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  planId: uuid('plan_id')
    .notNull()
    .references(() => plans.id, { onDelete: 'restrict' }),
  keyHash: text('key_hash').notNull().unique(),
  keyLast4: text('key_last4').notNull(),
  status: licenseKeyStatus('status').notNull().default('unredeemed'),
  redeemedCompanyId: uuid('redeemed_company_id').references(() => companies.id, { onDelete: 'set null' }),
  redeemedBy: text('redeemed_by').references(() => users.id, { onDelete: 'set null' }),
  redeemedAt: timestamptz('redeemed_at'),
  createdAt: timestamptz('created_at').defaultNow().notNull(),
});

export const licenses = pgTable(
  'licenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id, { onDelete: 'restrict' }),
    licenseKeyId: uuid('license_key_id')
      .notNull()
      .unique()
      .references(() => licenseKeys.id, { onDelete: 'restrict' }),
    seatCount: integer('seat_count').notNull(),
    validFrom: timestamptz('valid_from').notNull(),
    validUntil: timestamptz('valid_until'),
    status: licenseStatus('status').notNull().default('active'),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
    revokedAt: timestamptz('revoked_at'),
    expiryProcessedAt: timestamptz('expiry_processed_at'),
  },
  t => [
    index('licenses_company_product_idx').on(t.companyId, t.productId),
    index('licenses_valid_until_idx').on(t.validUntil),
    check('licenses_seat_count_positive', sql`${t.seatCount} > 0`),
  ],
);

export const seatPools = pgTable(
  'seat_pools',
  {
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
    lastReconciledAt: timestamptz('last_reconciled_at'),
  },
  t => [primaryKey({ name: 'seat_pools_pk', columns: [t.companyId, t.productId] })],
);

export const entitlementRules = pgTable(
  'entitlement_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    jobRole: text('job_role').notNull(),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
  },
  t => [unique('entitlement_rules_unique').on(t.companyId, t.productId, t.jobRole)],
);

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    prefix: text('prefix').notNull(),
    keyHash: text('key_hash').notNull().unique(),
    scopes: text('scopes').array().notNull(),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
    lastUsedAt: timestamptz('last_used_at'),
    revokedAt: timestamptz('revoked_at'),
  },
  t => [index('api_keys_company_id_idx').on(t.companyId)],
);

export const hrEvents = pgTable(
  'hr_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    eventId: text('event_id').notNull(),
    type: hrEventType('type').notNull(),
    hrId: text('hr_id').notNull(),
    payload: jsonb('payload').notNull(),
    payloadHash: text('payload_hash').notNull(),
    occurredAt: timestamptz('occurred_at').notNull(),
    receivedAt: timestamptz('received_at').defaultNow().notNull(),
    source: hrEventSource('source').notNull(),
    apiKeyId: uuid('api_key_id').references(() => apiKeys.id, { onDelete: 'set null' }),
    submittedBy: text('submitted_by').references(() => users.id, { onDelete: 'set null' }),
    status: hrEventStatus('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    nextAttemptAt: timestamptz('next_attempt_at').defaultNow(),
    processedAt: timestamptz('processed_at'),
    duplicateCount: integer('duplicate_count').notNull().default(0),
  },
  t => [
    unique('hr_events_company_event_id_unique').on(t.companyId, t.eventId),
    index('hr_events_status_next_attempt_idx').on(t.status, t.nextAttemptAt),
    index('hr_events_company_hr_id_idx').on(t.companyId, t.hrId),
  ],
);

export const seatAssignments = pgTable(
  'seat_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    status: seatStatus('status').notNull(),
    eligibleSince: timestamptz('eligible_since').notNull(),
    queueReason: seatReason('queue_reason').notNull(),
    assignedAt: timestamptz('assigned_at'),
    grantReason: seatReason('grant_reason'),
    endedAt: timestamptz('ended_at'),
    endReason: seatReason('end_reason'),
    causeEventId: uuid('cause_event_id').references(() => hrEvents.id, { onDelete: 'set null' }),
    causeRuleId: uuid('cause_rule_id'),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
  },
  t => [
    uniqueIndex('seat_assignments_one_open_row')
      .on(t.companyId, t.productId, t.employeeId)
      .where(sql`${t.status} IN ('waiting', 'assigned')`),
    index('seat_assignments_pool_status_idx').on(t.companyId, t.productId, t.status, t.eligibleSince),
    index('seat_assignments_employee_idx').on(t.employeeId),
  ],
);

export const clientTokens = pgTable(
  'client_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    prefix: text('prefix').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
    lastUsedAt: timestamptz('last_used_at'),
    revokedAt: timestamptz('revoked_at'),
  },
  t => [index('client_tokens_user_id_idx').on(t.userId)],
);

export const auditLog = pgTable(
  'audit_log',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'cascade' }),
    actorType: actorType('actor_type').notNull(),
    actorId: text('actor_id'),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id'),
    reason: text('reason'),
    causeEventId: uuid('cause_event_id').references(() => hrEvents.id, { onDelete: 'set null' }),
    employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'set null' }),
    data: jsonb('data').$type<Record<string, unknown>>(),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
  },
  t => [
    index('audit_log_company_created_idx').on(t.companyId, t.createdAt),
    index('audit_log_employee_idx').on(t.employeeId),
    index('audit_log_action_idx').on(t.action),
  ],
);

export const licenseChecks = pgTable(
  'license_checks',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    clientTokenId: uuid('client_token_id').references(() => clientTokens.id, { onDelete: 'set null' }),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    productSlug: text('product_slug').notNull(),
    companyId: uuid('company_id').references(() => companies.id, { onDelete: 'set null' }),
    allowed: boolean('allowed').notNull(),
    reason: text('reason'),
    createdAt: timestamptz('created_at').defaultNow().notNull(),
  },
  t => [
    index('license_checks_company_created_idx').on(t.companyId, t.createdAt),
    index('license_checks_user_created_idx').on(t.userId, t.createdAt),
  ],
);

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type MembershipRole = (typeof membershipRole.enumValues)[number];
export type Invitation = typeof invitations.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type LicenseKey = typeof licenseKeys.$inferSelect;
export type License = typeof licenses.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type EntitlementRule = typeof entitlementRules.$inferSelect;
export type SeatAssignment = typeof seatAssignments.$inferSelect;
export type SeatStatus = (typeof seatStatus.enumValues)[number];
export type SeatReason = (typeof seatReason.enumValues)[number];
export type HrEvent = typeof hrEvents.$inferSelect;
export type HrEventType = (typeof hrEventType.enumValues)[number];
export type HrEventStatus = (typeof hrEventStatus.enumValues)[number];
export type ApiKey = typeof apiKeys.$inferSelect;
export type ClientToken = typeof clientTokens.$inferSelect;
export type AuditEntry = typeof auditLog.$inferSelect;
export type ActorType = (typeof actorType.enumValues)[number];
