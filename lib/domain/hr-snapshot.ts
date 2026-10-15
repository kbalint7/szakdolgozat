import { z } from '@/lib/validation/zod';

import type { HrEventInput } from './hr-events';

export const MAX_SNAPSHOT_EMPLOYEES = 5000;

export const hrSnapshotSchema = z
  .object({
    snapshotId: z.string().trim().min(1).max(100),
    occurredAt: z.iso.datetime({ offset: true }),
    employees: z
      .array(
        z.strictObject({
          hrId: z.string().trim().min(1).max(64),
          jobRole: z
            .string()
            .min(1)
            .max(64)
            .regex(/^[a-z0-9_-]+$/, 'must match [a-z0-9_-]+'),
          email: z.email().max(254).optional(),
          name: z.string().trim().min(1).max(200).optional(),
        }),
      )
      .max(MAX_SNAPSHOT_EMPLOYEES),
  })
  .strict()
  .superRefine((snapshot, ctx) => {
    const seen = new Set<string>();
    snapshot.employees.forEach((employee, index) => {
      if (seen.has(employee.hrId)) {
        ctx.addIssue({ code: 'custom', path: ['employees', index, 'hrId'], message: 'duplicate hrId' });
      }
      seen.add(employee.hrId);
    });
  });

export type HrSnapshot = z.infer<typeof hrSnapshotSchema>;

export type StoredEmployee = { hrId: string; status: 'active' | 'terminated'; jobRole: string };

export type SnapshotDiff = {
  events: HrEventInput[];
  hired: number;
  roleChanged: number;
  terminated: number;
  unchanged: number;
};

export function diffSnapshot(stored: readonly StoredEmployee[], snapshot: HrSnapshot): SnapshotDiff {
  const occurredAt = new Date(snapshot.occurredAt).toISOString();
  const eventId = (hrId: string) => `snapshot:${snapshot.snapshotId}:${hrId}`.slice(0, 128);
  const storedById = new Map(stored.map(employee => [employee.hrId, employee]));
  const inSnapshot = new Set(snapshot.employees.map(employee => employee.hrId));
  const diff: SnapshotDiff = { events: [], hired: 0, roleChanged: 0, terminated: 0, unchanged: 0 };

  for (const employee of snapshot.employees) {
    const current = storedById.get(employee.hrId);
    const details = {
      hrId: employee.hrId,
      jobRole: employee.jobRole,
      ...(employee.email ? { email: employee.email } : {}),
      ...(employee.name ? { name: employee.name } : {}),
    };
    if (!current || current.status === 'terminated') {
      diff.events.push({ eventId: eventId(employee.hrId), type: 'employee.hired', occurredAt, employee: details });
      diff.hired++;
    } else if (current.jobRole !== employee.jobRole) {
      diff.events.push({
        eventId: eventId(employee.hrId),
        type: 'employee.role_changed',
        occurredAt,
        employee: details,
      });
      diff.roleChanged++;
    } else {
      diff.unchanged++;
    }
  }

  for (const employee of stored) {
    if (employee.status === 'active' && !inSnapshot.has(employee.hrId)) {
      diff.events.push({
        eventId: eventId(employee.hrId),
        type: 'employee.terminated',
        occurredAt,
        employee: { hrId: employee.hrId },
      });
      diff.terminated++;
    }
  }
  return diff;
}
