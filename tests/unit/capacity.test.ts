import { describe, expect, it } from 'vitest';

import { earliestExpiry, isLicenseValid, poolCapacity, type LicenseLike } from '@/lib/domain/capacity';
import { compareSeniority } from '@/lib/domain/seniority';

const d = (iso: string) => new Date(iso);

const license = (overrides: Partial<LicenseLike> = {}): LicenseLike => ({
  seatCount: 10,
  status: 'active',
  validFrom: d('2026-01-01T00:00:00Z'),
  validUntil: d('2027-01-01T00:00:00Z'),
  ...overrides,
});

describe('BR-03 capacity', () => {
  const now = d('2026-06-01T00:00:00Z');

  it('counts active licences within their validity window', () => {
    expect(poolCapacity([license(), license({ seatCount: 5, validUntil: null })], now)).toBe(15);
  });

  it('ignores revoked, not-yet-valid and expired licences', () => {
    expect(
      poolCapacity(
        [
          license({ status: 'revoked' }),
          license({ validFrom: d('2026-07-01T00:00:00Z') }),
          license({ validUntil: d('2026-05-31T23:59:59Z') }),
        ],
        now,
      ),
    ).toBe(0);
  });

  it('treats validUntil as exclusive and validFrom as inclusive', () => {
    expect(isLicenseValid(license({ validFrom: now }), now)).toBe(true);
    expect(isLicenseValid(license({ validUntil: now }), now)).toBe(false);
  });

  it('reports the earliest expiry of valid fixed-term licences', () => {
    expect(
      earliestExpiry(
        [
          license({ validUntil: d('2026-09-01T00:00:00Z') }),
          license({ validUntil: null }),
          license({ validUntil: d('2026-05-01T00:00:00Z') }),
        ],
        now,
      ),
    ).toEqual(d('2026-09-01T00:00:00Z'));
  });
});

describe('seniority order (BR-07 and BR-11 d agree)', () => {
  it('orders by assignedAt, then eligibleSince, then HR ID', () => {
    const at = d('2026-01-01T00:00:00Z');
    const rows = [
      { hrId: 'E-3', assignedAt: at, eligibleSince: d('2025-01-02T00:00:00Z') },
      { hrId: 'E-2', assignedAt: at, eligibleSince: d('2025-01-01T00:00:00Z') },
      { hrId: 'E-1', assignedAt: at, eligibleSince: d('2025-01-01T00:00:00Z') },
      { hrId: 'E-0', assignedAt: d('2026-02-01T00:00:00Z'), eligibleSince: d('2024-01-01T00:00:00Z') },
    ];
    expect([...rows].sort(compareSeniority).map(r => r.hrId)).toEqual(['E-1', 'E-2', 'E-3', 'E-0']);
  });
});
