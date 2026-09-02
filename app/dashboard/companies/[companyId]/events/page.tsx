import { InboxIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AccessDenied } from '@/components/access-denied';
import { Callout } from '@/components/callout';
import { ChipLink, ChipRow } from '@/components/chip-link';
import { Mono } from '@/components/code';
import { EmptyState } from '@/components/empty-state';
import { ActionButton } from '@/components/forms/action-button';
import { PageHeader } from '@/components/page-header';
import { StatusBadge, type StatusTone } from '@/components/status-badge';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCompanyContext } from '@/lib/auth/company';
import { formatTimestamp } from '@/lib/format';
import { hrEventSourceLabels, hrEventStatusLabels, hrEventTypeLabels, label } from '@/lib/i18n/labels';
import { countHrEventsByStatus, listHrEvents, MAX_ATTEMPTS, type InboxFilter } from '@/lib/services/hr-events';

import { retryEventAction } from './actions';

export const metadata: Metadata = { title: 'HR-események' };

const filters: { value: InboxFilter; label: string }[] = [
  { value: undefined, label: 'Mind' },
  { value: 'pending', label: 'Függőben' },
  { value: 'processed', label: 'Feldolgozva' },
  { value: 'stale', label: 'Elavult' },
  { value: 'failed', label: 'Sikertelen' },
  { value: 'retrying', label: 'Újrapróbálásra vár' },
  { value: 'duplicate', label: 'Ismételten érkezett' },
];

const statusTone: Record<string, StatusTone> = {
  pending: 'info',
  processed: 'success',
  stale: 'neutral',
  failed: 'danger',
};

function parseFilter(value: string | string[] | undefined): InboxFilter {
  const match = filters.find(filter => filter.value === value);
  return match?.value;
}

export default async function EventsPage({
  params,
  searchParams,
}: PageProps<'/dashboard/companies/[companyId]/events'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);
  if (!ctx.can('hrEvents.view')) return <AccessDenied />;

  const filter = parseFilter((await searchParams).status);
  const [events, counts] = await Promise.all([listHrEvents(companyId, filter), countHrEventsByStatus(companyId)]);
  const base = `/dashboard/companies/${companyId}/events`;

  return (
    <>
      <PageHeader
        eyebrow={ctx.company.name}
        title="HR-események"
        description="A HR-rendszerből érkezett változások (belépés, munkakörváltás, kilépés) és a feldolgozásuk állapota."
      />

      <ChipRow label="Szűrés állapot szerint">
        {filters.map(item => (
          <ChipLink
            key={item.label}
            href={item.value ? `${base}?status=${item.value}` : base}
            active={item.value === filter}
            count={item.value && item.value in counts ? counts[item.value as keyof typeof counts] : undefined}
          >
            {item.label}
          </ChipLink>
        ))}
      </ChipRow>

      {events.length === 0 ? (
        <EmptyState
          icon={<InboxIcon />}
          title={filter ? 'Nincs ilyen esemény' : 'Még nem érkezett esemény'}
          description={
            <>
              Az események a HR-rendszerből érkeznek egy API-kulccsal, de kézzel is rögzíthetsz eseményt a Munkavállalók
              oldalon.
            </>
          }
        />
      ) : (
        <TableCard footer={<span className="nums text-muted-foreground">{events.length} esemény</span>}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Beérkezett</TableHead>
                <TableHead>Esemény</TableHead>
                <TableHead>Munkavállaló</TableHead>
                <TableHead>Történt</TableHead>
                <TableHead>Állapot</TableHead>
                <TableHead className="text-right">Próbálkozás</TableHead>
                <TableHead>Hiba</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map(event => (
                <TableRow key={event.id}>
                  <TableCell className="nums text-xs text-muted-foreground">
                    {formatTimestamp(event.receivedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{label(hrEventTypeLabels, event.type)}</div>
                    <div className="text-xs text-muted-foreground">
                      <Mono>{event.eventId}</Mono> · {label(hrEventSourceLabels, event.source)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.employeeId ? (
                      <Link
                        href={`/dashboard/companies/${companyId}/employees/${event.employeeId}`}
                        className="hover:underline"
                      >
                        <Mono>{event.hrId}</Mono>
                      </Link>
                    ) : (
                      <Mono>{event.hrId}</Mono>
                    )}
                  </TableCell>
                  <TableCell className="nums text-xs">{formatTimestamp(event.occurredAt)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <StatusBadge tone={statusTone[event.status] ?? 'neutral'}>
                        {label(hrEventStatusLabels, event.status)}
                      </StatusBadge>
                      {event.duplicateCount > 0 && (
                        <StatusBadge tone="neutral" dot={false}>
                          {event.duplicateCount}× ismételt
                        </StatusBadge>
                      )}
                    </div>
                    {event.status === 'failed' && event.nextAttemptAt && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        újra: {formatTimestamp(event.nextAttemptAt)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="nums text-right">{event.attempts}</TableCell>
                  <TableCell className="max-w-64 text-xs break-words text-destructive">{event.lastError}</TableCell>
                  <TableCell className="text-right">
                    {event.status === 'failed' && ctx.can('hrEvents.retry') && (
                      <ActionButton
                        variant="outline"
                        size="sm"
                        action={retryEventAction.bind(null, companyId, event.id)}
                      >
                        Újrapróbálás
                      </ActionButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}

      <Callout tone="note" title="Sikertelen és elavult események">
        Ha egy esemény feldolgozása nem sikerül, a rendszer {MAX_ATTEMPTS - 1} alkalommal, egyre hosszabb szünetekkel
        újrapróbálja, utána kézzel indíthatod újra. Ha egy esemény régebbi, mint a munkavállaló már ismert állapota,
        „elavult” jelölést kap, és nem változtat semmin.
      </Callout>
    </>
  );
}
