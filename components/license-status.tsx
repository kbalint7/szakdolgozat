import { StatusBadge } from '@/components/status-badge';

type LicenseLike = { status: 'active' | 'revoked'; validFrom: Date; validUntil: Date | null };

export function licenseState(license: LicenseLike, now: Date) {
  if (license.status === 'revoked') return 'revoked' as const;
  if (license.validFrom > now) return 'pending' as const;
  if (license.validUntil && license.validUntil <= now) return 'expired' as const;
  return 'valid' as const;
}

export function LicenseStatusBadge({ license, now }: { license: LicenseLike; now: Date }) {
  switch (licenseState(license, now)) {
    case 'revoked':
      return <StatusBadge tone="danger">Visszavont</StatusBadge>;
    case 'pending':
      return <StatusBadge tone="info">Még nem érvényes</StatusBadge>;
    case 'expired':
      return <StatusBadge tone="neutral">Lejárt</StatusBadge>;
    default:
      return <StatusBadge tone="success">Érvényes</StatusBadge>;
  }
}
