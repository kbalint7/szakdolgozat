import { StatusBadge } from '@/components/status-badge';
import type { MySoftwareRow } from '@/lib/services/license-check';

export function SoftwareStatus({ row }: { row: Pick<MySoftwareRow, 'status' | 'position'> }) {
  switch (row.status) {
    case 'allowed':
      return <StatusBadge tone="success">Használható</StatusBadge>;
    case 'waiting':
      return <StatusBadge tone="warning">Várólistán: {row.position}.</StatusBadge>;
    default:
      return <StatusBadge tone="danger">Nincs érvényes licenc</StatusBadge>;
  }
}
