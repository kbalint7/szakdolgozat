import { StatusBadge } from '@/components/status-badge';
import { formatUntil } from '@/lib/format';
import type { MySoftwareRow } from '@/lib/services/license-check';

export function SoftwareStatus({ row }: { row: Pick<MySoftwareRow, 'status' | 'position'> }) {
  switch (row.status) {
    case 'allowed':
      return <StatusBadge tone="success">Használható</StatusBadge>;
    case 'waiting':
      return <StatusBadge tone="warning">{row.position}. a várólistán</StatusBadge>;
    default:
      return <StatusBadge tone="danger">Nincs érvényes licenc</StatusBadge>;
  }
}

export function softwareValidity(row: Pick<MySoftwareRow, 'validUntil'>) {
  return row.validUntil ? formatUntil(row.validUntil) : 'határozatlan ideig';
}

export const noSoftware = {
  title: 'Még nincs szoftvered',
  description: 'Akkor kapsz helyet, ha a cégednél a munkakörödhöz jár szoftver.',
};
