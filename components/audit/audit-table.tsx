import { ScrollTextIcon } from 'lucide-react';
import Link from 'next/link';

import { Mono } from '@/components/code';
import { EmptyState } from '@/components/empty-state';
import { LinkButton } from '@/components/link-button';
import { StatusBadge, type StatusTone } from '@/components/status-badge';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatTimestamp } from '@/lib/format';
import { actorTypeLabels, auditActionLabels, label } from '@/lib/i18n/labels';
import { seatReasonLabel } from '@/lib/i18n/reasons';
import type { listAuditEntries } from '@/lib/services/audit-queries';

type Entry = Awaited<ReturnType<typeof listAuditEntries>>['entries'][number];

function summarize(data: Record<string, unknown> | null): string | null {
  if (!data) return null;
  const parts = Object.entries(data)
    .filter(([, value]) => value !== null && value !== undefined && typeof value !== 'object')
    .map(([key, value]) => `${key}: ${String(value)}`);
  return parts.length ? parts.join(' · ') : null;
}

function reasonTone(reason: string): StatusTone {
  if (['RULE_MATCHED', 'SEAT_FREED', 'CAPACITY_ADDED'].includes(reason)) return 'success';
  if (reason === 'CAPACITY_REDUCED') return 'warning';
  return 'danger';
}

export function AuditTable({
  entries,
  showCompany,
  employeeHref,
  olderHref,
}: {
  entries: Entry[];
  showCompany?: boolean;
  employeeHref?: (employeeId: string, companyId: string | null) => string;
  olderHref?: string | null;
}) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<ScrollTextIcon />}
        title="Nincs bejegyzés"
        description="A szűrésnek megfelelő bejegyzés nem található."
      />
    );
  }

  return (
    <TableCard
      footer={
        <>
          <span className="nums text-muted-foreground">{entries.length} bejegyzés</span>
          {olderHref && (
            <LinkButton href={olderHref} variant="outline" size="sm" className="ml-auto">
              Korábbi bejegyzések
            </LinkButton>
          )}
        </>
      }
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Időpont</TableHead>
            {showCompany && <TableHead>Cég</TableHead>}
            <TableHead>Végrehajtó</TableHead>
            <TableHead>Művelet</TableHead>
            <TableHead>Munkavállaló</TableHead>
            <TableHead>Ok</TableHead>
            <TableHead>Kiváltó esemény</TableHead>
            <TableHead>Részletek</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map(entry => (
            <TableRow key={entry.id}>
              <TableCell className="nums text-xs whitespace-nowrap text-muted-foreground">
                {formatTimestamp(entry.createdAt)}
              </TableCell>
              {showCompany && <TableCell>{entry.companyName ?? '–'}</TableCell>}
              <TableCell>
                <div>{entry.actorName ?? (entry.actorType === 'system' ? 'worker' : '–')}</div>
                <div className="text-xs text-muted-foreground">{label(actorTypeLabels, entry.actorType)}</div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{label(auditActionLabels, entry.action)}</div>
                <div className="font-mono text-xs text-muted-foreground">{entry.action}</div>
              </TableCell>
              <TableCell>
                {entry.employee ? (
                  employeeHref ? (
                    <Link href={employeeHref(entry.employee.id, entry.companyId)} className="hover:underline">
                      <Mono>{entry.employee.hrId}</Mono>
                    </Link>
                  ) : (
                    <Mono>{entry.employee.hrId}</Mono>
                  )
                ) : (
                  '–'
                )}
              </TableCell>
              <TableCell>
                {entry.reason ? (
                  <StatusBadge tone={reasonTone(entry.reason)} dot={false} title={entry.reason}>
                    {seatReasonLabel(entry.reason)}
                  </StatusBadge>
                ) : (
                  '–'
                )}
              </TableCell>
              <TableCell>{entry.causeEventId ? <Mono>{entry.causeEventId}</Mono> : '–'}</TableCell>
              <TableCell className="max-w-72 text-xs break-words whitespace-normal text-muted-foreground">
                {summarize(entry.data) ?? '–'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
