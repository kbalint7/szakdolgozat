import { describe, expect, it } from 'vitest';

import { processEvent } from '@/lib/services/hr-events';
import { ingestSnapshot } from '@/lib/services/hr-snapshot';

import { createProductWithPlan, createTestCompany, employeeByHrId, poolState } from './fixtures';

describe('EMP-9 snapshot', () => {
  it('recovers lost events: missing hires, a role change and a missing termination', async () => {
    const { product, plan } = await createProductWithPlan(5);
    const test = await createTestCompany();
    await test.rule('developer', product.id);
    await test.license(plan.id);
    await test.hire('E-1');
    await test.hire('E-2');
    await test.hire('E-3');

    const { diff, accepted } = await ingestSnapshot(
      { companyId: test.company.id, apiKeyId: test.apiKey.id },
      {
        snapshotId: 'nightly-1',
        occurredAt: new Date(Date.UTC(2026, 11, 1)).toISOString(),
        employees: [
          { hrId: 'E-1', jobRole: 'developer' },
          { hrId: 'E-2', jobRole: 'accountant' },
          { hrId: 'E-4', jobRole: 'developer' },
        ],
      },
    );
    expect(diff).toMatchObject({ hired: 1, roleChanged: 1, terminated: 1, unchanged: 1 });
    for (const event of accepted) expect(await processEvent(event.id)).toMatchObject({ outcome: 'processed' });

    expect((await employeeByHrId(test.company.id, 'E-3')).status).toBe('terminated');
    expect((await employeeByHrId(test.company.id, 'E-2')).jobRole).toBe('accountant');
    expect((await poolState(test.company.id, product.id)).assigned).toEqual(['E-1', 'E-4']);

    const again = await ingestSnapshot(
      { companyId: test.company.id, apiKeyId: test.apiKey.id },
      {
        snapshotId: 'nightly-2',
        occurredAt: new Date(Date.UTC(2026, 11, 2)).toISOString(),
        employees: [
          { hrId: 'E-1', jobRole: 'developer' },
          { hrId: 'E-2', jobRole: 'accountant' },
          { hrId: 'E-4', jobRole: 'developer' },
        ],
      },
    );
    expect(again.diff.events).toEqual([]);
  });

  it('an older snapshot cannot overwrite newer state (BR-09)', async () => {
    const test = await createTestCompany();
    await test.hire('E-1', 'developer', { occurredAt: new Date(Date.UTC(2026, 11, 5)).toISOString() });
    const { accepted } = await ingestSnapshot(
      { companyId: test.company.id, apiKeyId: test.apiKey.id },
      { snapshotId: 'old', occurredAt: new Date(Date.UTC(2026, 11, 1)).toISOString(), employees: [] },
    );
    expect(await processEvent(accepted[0].id)).toMatchObject({ outcome: 'stale' });
    expect((await employeeByHrId(test.company.id, 'E-1')).status).toBe('active');
  });
});
