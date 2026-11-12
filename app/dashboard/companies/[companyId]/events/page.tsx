import { cn } from 'cn';
import { ChevronDownIcon, InboxIcon, SearchXIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AccessDenied } from '@/components/access-denied';
import { ChipDivider, ChipLink, ChipRow } from '@/components/chip-link';
import { Ident } from '@/components/code';
import { Fact, FactList, TechnicalDetails, TechValue } from '@/components/detail-list';
import { EmptyState } from '@/components/empty-state';
import { FilterBar, FilterReset, FilterSearch } from '@/components/filter-bar';
import { ActionButton } from '@/components/forms/action-button';
import { PageHeader } from '@/components/page-header';
import { StatusBadge, type StatusTone } from '@/components/status-badge';
import { EmptyRow, LoadMore, TableCard } from '@/components/table-card';
import { getCompanyContext } from '@/lib/auth/company';
import { formatDateTime, formatTimestamp } from '@/lib/format';
import { hrEventSourceLabels, hrEventStatusLabels, hrEventTypeLabels, label } from '@/lib/i18n/labels';
import { countHrEventsByStatus, listHrEvents } from '@/lib/services/hr-events';

import { moreHref, parseListLimit, parseListSearch } from '../list-limit';
import { retryEventAction } from './actions';

export const metadata: Metadata = { title: 'HR-események' };

const tabs = [
  { value: 'pending', label: 'Függőben' },
  { value: 'processed', label: 'Feldolgozva' },
  { value: 'stale', label: 'Elavult' },
  { value: 'failed', label: 'Sikertelen' },
] as const;

type Tab = (typeof tabs)[number]['value'];

const statusTone: Record<string, StatusTone> = {
  pending: 'info',
  stale: 'neutral',
  failed: 'danger',
};

const grid =
  'grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0.5 lg:grid-cols-[9.5rem_minmax(0,12rem)_minmax(0,16rem)_minmax(0,9rem)_minmax(1rem,1fr)]';

function parseTab(value: string | string[] | undefined): Tab | undefined {
  return tabs.find(tab => tab.value === value)?.value;
}

function retryState(nextAttemptAt: Date | null, now: Date) {
  if (!nextAttemptAt) return 'never' as const;
  return nextAttemptAt > now ? ('scheduled' as const) : ('due' as const);
}

function explain(status: string, retry: ReturnType<typeof retryState>, canRetry: boolean): string | null {
  if (status === 'failed') {
    if (retry !== 'never') return 'Nem sikerült feldolgozni. Hamarosan újra megpróbáljuk.';
    return canRetry
      ? 'Nem sikerült feldolgozni, és automatikusan már nem próbáljuk újra. Az Újrapróbálás gombbal te még megpróbálhatod.'
      : 'Nem sikerült feldolgozni, és automatikusan már nem próbáljuk újra.';
  }
  if (status === 'stale') return 'Ennél frissebb adatunk van a munkavállalóról, ezért nem változott semmi.';
  return null;
}

export default async function EventsPage({
  params,
  searchParams,
}: PageProps<'/dashboard/companies/[companyId]/events'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);
  if (!ctx.can('hrEvents.view')) return <AccessDenied />;

  const query = await searchParams;
  const tab = parseTab(query.status);
  const repeated = query.repeated === '1';
  const search = parseListSearch(query.q);
  const linked = typeof query.event === 'string' ? query.event : undefined;
  const limit = parseListLimit(query.limit);
  const [events, counts] = await Promise.all([
    listHrEvents(companyId, tab, limit, repeated, search),
    countHrEventsByStatus(companyId, search),
  ]);
  const now = new Date();
  const company = `/dashboard/companies/${companyId}`;
  const base = `${company}/events`;
  const canRetry = ctx.can('hrEvents.retry');

  const countOf = (status: Tab) => (repeated ? counts.repeated[status] : counts[status]) ?? 0;
  const everything = repeated ? counts.duplicate : counts.all;
  const matching = tab ? countOf(tab) : everything;
  const repeatedCount = tab ? (counts.repeated[tab] ?? 0) : counts.duplicate;
  const filtered = Boolean(search || tab || repeated);

  function href(status: Tab | undefined, again: boolean) {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (status) params.set('status', status);
    if (again) params.set('repeated', '1');
    return params.size > 0 ? `${base}?${params}` : base;
  }

  return (
    <>
      <PageHeader
        trail={[{ href: company, label: ctx.company.name }]}
        trailMobileOnly
        title="HR-események"
        description="A HR-rendszerből érkezett események és a feldolgozásuk állapota."
      />

      {counts.all === 0 && !search ? (
        <EmptyState
          icon={<InboxIcon />}
          title="Még nem érkezett esemény"
          description="Az eseményeket a HR-rendszer küldi egy API-kulccsal. Kézzel a Munkavállalók oldalon rögzíthetsz egyet."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <FilterBar keep={{ status: tab, repeated: repeated ? '1' : undefined }}>
            <FilterSearch defaultValue={search} placeholder="Név vagy HR-azonosító" className="sm:w-52" />
            <ChipRow label="Állapot">
              <ChipLink href={href(undefined, repeated)} active={!tab} count={everything}>
                Mind
              </ChipLink>
              {tabs.map(item => (
                <ChipLink
                  key={item.value}
                  href={href(item.value, repeated)}
                  active={item.value === tab}
                  count={countOf(item.value)}
                >
                  {item.label}
                </ChipLink>
              ))}
              <ChipDivider />
              <ChipLink href={href(tab, !repeated)} active={repeated} count={repeatedCount}>
                Többször érkezett
              </ChipLink>
            </ChipRow>
            {filtered && <FilterReset href={base} />}
          </FilterBar>

          {events.length === 0 && search ? (
            <EmptyState
              compact
              icon={<SearchXIcon />}
              title="Nincs találat"
              description="Módosítsd a keresést vagy az állapotszűrőt."
            />
          ) : (
            <TableCard
              footer={
                events.length < matching && (
                  <LoadMore
                    href={moreHref(base, { q: search, status: tab, repeated: repeated ? '1' : undefined }, limit)}
                    shown={events.length}
                    total={matching}
                  />
                )
              }
            >
              {events.length === 0 ? (
                <EmptyRow>
                  {repeated ? 'Ezekre a szűrőkre nincs találat.' : 'Most egyetlen esemény sincs ebben az állapotban.'}
                </EmptyRow>
              ) : (
                <>
                  <div
                    className={cn(
                      grid,
                      'hidden h-10 items-center border-b px-5 text-xs font-medium text-muted-foreground lg:grid',
                    )}
                  >
                    <span>Beérkezett</span>
                    <span>Esemény</span>
                    <span>Munkavállaló</span>
                    <span>Állapot</span>
                    <span className="sr-only">Részletek</span>
                  </div>
                  <ul className="text-sm">
                    {events.map(event => {
                      const failed = event.status === 'failed';
                      const retry = retryState(event.nextAttemptAt, now);
                      const sentence = explain(event.status, retry, canRetry);
                      const employeeHref = event.employeeId ? `${company}/employees/${event.employeeId}` : null;
                      const name = event.employeeName ?? <span className="text-muted-foreground">Név nélkül</span>;
                      return (
                        <li key={event.id} className="border-b border-border/70 last:border-0">
                          <details
                            className="group/event open:bg-muted/40"
                            open={(failed && tab === 'failed') || event.id === linked}
                          >
                            <summary className="relative block cursor-pointer list-none px-5 py-3 pr-11 transition-colors outline-none hover:bg-muted/40 focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset lg:pr-5 dark:hover:bg-muted/70 [&::-webkit-details-marker]:hidden">
                              <span className={grid}>
                                <span className="flex min-w-0 items-baseline gap-2 lg:order-2">
                                  <span className="min-w-0 truncate font-medium" title={event.type}>
                                    {label(hrEventTypeLabels, event.type)}
                                  </span>
                                  {event.duplicateCount > 0 && (
                                    <span
                                      className="nums shrink-0 text-[13px] whitespace-nowrap text-muted-foreground"
                                      title="Ugyanaz az esemény többször is megérkezett, de csak egyszer dolgoztuk fel."
                                    >
                                      {event.duplicateCount + 1}× érkezett
                                    </span>
                                  )}
                                </span>
                                <span className="justify-self-end text-[13px] lg:order-4 lg:justify-self-start lg:text-sm">
                                  {event.status === 'processed' ? (
                                    <StatusBadge tone="neutral" dot="hidden">
                                      Feldolgozva
                                    </StatusBadge>
                                  ) : (
                                    <StatusBadge tone={statusTone[event.status] ?? 'neutral'} className="align-top">
                                      {label(hrEventStatusLabels, event.status)}
                                    </StatusBadge>
                                  )}
                                </span>
                                <span className="col-span-2 flex min-w-0 items-baseline justify-between gap-4 lg:contents">
                                  <span className="min-w-0 truncate text-[13px] lg:order-3 lg:text-sm">
                                    {employeeHref ? (
                                      <Link href={employeeHref} className="hover:underline">
                                        {name}
                                      </Link>
                                    ) : (
                                      name
                                    )}{' '}
                                    <Ident className="ml-1">{event.hrId}</Ident>
                                  </span>
                                  <span className="nums shrink-0 text-[13px] whitespace-nowrap text-muted-foreground lg:order-1 lg:text-sm">
                                    {formatDateTime(event.receivedAt)}
                                  </span>
                                </span>
                                <ChevronDownIcon
                                  aria-hidden
                                  className="absolute top-3.5 right-5 size-4 text-muted-foreground/60 transition-transform group-open/event:rotate-180 lg:static lg:order-5 lg:self-center lg:justify-self-end"
                                />
                              </span>
                            </summary>
                            <div className="flex flex-col gap-3 px-5 pt-1 pb-4 text-[13px] lg:pl-[11.75rem]">
                              {(sentence || (failed && canRetry)) && (
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                  {sentence && <p className="max-w-[68ch] text-sm text-pretty">{sentence}</p>}
                                  {failed && canRetry && (
                                    <ActionButton
                                      variant="outline"
                                      size="sm"
                                      action={retryEventAction.bind(null, companyId, event.id)}
                                    >
                                      Újrapróbálás
                                    </ActionButton>
                                  )}
                                </div>
                              )}
                              <FactList className="nums">
                                <Fact term="A változás időpontja">{formatTimestamp(event.occurredAt)}</Fact>
                                <Fact term="Beérkezett">{formatTimestamp(event.receivedAt)}</Fact>
                                {event.processedAt && (
                                  <Fact term="Feldolgozva">{formatTimestamp(event.processedAt)}</Fact>
                                )}
                                <Fact term="Forrás">{label(hrEventSourceLabels, event.source)}</Fact>
                                {event.duplicateCount > 0 && (
                                  <Fact term="Többször érkezett">
                                    összesen {event.duplicateCount + 1} alkalommal, de csak egyszer dolgoztuk fel
                                  </Fact>
                                )}
                                {(failed || event.attempts > 1) && <Fact term="Próbálkozások">{event.attempts}</Fact>}
                                {failed && retry !== 'never' && (
                                  <Fact term="Következő próbálkozás">
                                    {retry === 'scheduled' ? formatTimestamp(event.nextAttemptAt) : 'hamarosan'}
                                  </Fact>
                                )}
                              </FactList>
                              <TechnicalDetails>
                                <FactList className="gap-y-1.5">
                                  <Fact term="Eseményazonosító">
                                    <TechValue>{event.eventId}</TechValue>
                                  </Fact>
                                  {event.lastError && (
                                    <Fact term={failed ? 'Hibaüzenet' : 'Korábbi hiba'}>
                                      <TechValue>{event.lastError}</TechValue>
                                    </Fact>
                                  )}
                                </FactList>
                              </TechnicalDetails>
                            </div>
                          </details>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </TableCard>
          )}
        </div>
      )}
    </>
  );
}
