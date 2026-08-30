import { z } from '@/lib/validation/zod';

export const HR_EVENT_TYPES = ['employee.hired', 'employee.role_changed', 'employee.terminated'] as const;
export type HrEventType = (typeof HR_EVENT_TYPES)[number];

const jobRole = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9_-]+$/, 'must match [a-z0-9_-]+');

export const hrEventSchema = z
  .object({
    eventId: z.string().trim().min(1).max(128),
    type: z.enum(HR_EVENT_TYPES),
    occurredAt: z.iso.datetime({ offset: true }),
    employee: z.strictObject({
      hrId: z.string().trim().min(1).max(64),
      email: z.email().max(254).optional(),
      name: z.string().trim().min(1).max(200).optional(),
      jobRole: jobRole.optional(),
    }),
  })
  .strict()
  .superRefine((event, ctx) => {
    if (event.type !== 'employee.terminated' && !event.employee.jobRole) {
      ctx.addIssue({ code: 'custom', path: ['employee', 'jobRole'], message: `required for ${event.type}` });
    }
  });

export type HrEventInput = z.infer<typeof hrEventSchema>;

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function normalizedPayload(event: HrEventInput) {
  return { ...event, occurredAt: new Date(event.occurredAt).toISOString() };
}

export function isStale(occurredAt: Date, stateAsOf: Date): boolean {
  return occurredAt.getTime() <= stateAsOf.getTime();
}

export type EmployeeRecord = {
  status: 'active' | 'terminated';
  jobRole: string;
  email: string | null;
  name: string | null;
};

export function nextEmployeeState(current: EmployeeRecord | null, event: HrEventInput): EmployeeRecord {
  const email = event.employee.email ?? current?.email ?? null;
  const name = event.employee.name ?? current?.name ?? null;
  switch (event.type) {
    case 'employee.hired':
    case 'employee.role_changed':
      return { status: 'active', jobRole: event.employee.jobRole!, email, name };
    case 'employee.terminated':
      return { status: 'terminated', jobRole: event.employee.jobRole ?? current?.jobRole ?? '', email, name };
  }
}

export const RETRY_DELAYS_MS = [1_000, 5_000, 30_000, 120_000, 600_000] as const;
export const MAX_ATTEMPTS = 1 + RETRY_DELAYS_MS.length;

export function nextAttemptAt(attempts: number, now: Date): Date | null {
  if (attempts < 1 || attempts >= MAX_ATTEMPTS) return null;
  return new Date(now.getTime() + RETRY_DELAYS_MS[attempts - 1]);
}
