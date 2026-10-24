import { describe, expect, it } from 'vitest';

import { diffSnapshot, hrSnapshotSchema, type HrSnapshot } from '@/lib/domain/hr-snapshot';

const snapshot = (employees: HrSnapshot['employees']): HrSnapshot => ({
  snapshotId: 'snap-1',
  occurredAt: '2026-11-03T12:00:00Z',
  employees,
});

describe('EMP-9 snapshot diff', () => {
  it('hires the unknown and the terminated, changes roles, terminates the missing', () => {
    const diff = diffSnapshot(
      [
        { hrId: 'E-1', status: 'active', jobRole: 'developer' },
        { hrId: 'E-2', status: 'active', jobRole: 'developer' },
        { hrId: 'E-3', status: 'active', jobRole: 'designer' },
        { hrId: 'E-4', status: 'terminated', jobRole: 'designer' },
        { hrId: 'E-5', status: 'terminated', jobRole: 'designer' },
      ],
      snapshot([
        { hrId: 'E-1', jobRole: 'developer' },
        { hrId: 'E-2', jobRole: 'accountant' },
        { hrId: 'E-4', jobRole: 'designer' },
        { hrId: 'E-9', jobRole: 'developer', name: 'Új Ember' },
      ]),
    );
    expect(diff).toMatchObject({ hired: 2, roleChanged: 1, terminated: 1, unchanged: 1 });
    expect(diff.events.map(event => [event.type, event.employee.hrId])).toEqual([
      ['employee.role_changed', 'E-2'],
      ['employee.hired', 'E-4'],
      ['employee.hired', 'E-9'],
      ['employee.terminated', 'E-3'],
    ]);
    expect(diff.events.every(event => event.occurredAt === '2026-11-03T12:00:00.000Z')).toBe(true);
    expect(diff.events[0].eventId).toBe('snapshot:snap-1:E-2');
  });

  it('an identical snapshot produces no events', () => {
    const diff = diffSnapshot(
      [{ hrId: 'E-1', status: 'active', jobRole: 'developer' }],
      snapshot([{ hrId: 'E-1', jobRole: 'developer' }]),
    );
    expect(diff.events).toEqual([]);
  });

  it('rejects duplicate HR IDs and invalid job roles', () => {
    expect(
      hrSnapshotSchema.safeParse(
        snapshot([
          { hrId: 'E-1', jobRole: 'developer' },
          { hrId: 'E-1', jobRole: 'designer' },
        ]),
      ).success,
    ).toBe(false);
    expect(hrSnapshotSchema.safeParse(snapshot([{ hrId: 'E-1', jobRole: 'Developer' }])).success).toBe(false);
  });
});
