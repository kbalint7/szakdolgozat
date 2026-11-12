import { cn } from 'cn';
import { ChevronDownIcon, CornerDownRightIcon, ScrollTextIcon } from 'lucide-react';
import Link from 'next/link';

import { Ident } from '@/components/code';
import { Fact, FactList, TechnicalDetails, TechValue } from '@/components/detail-list';
import { EmptyState } from '@/components/empty-state';
import { MetaLine } from '@/components/meta-line';
import { StatusBadge, type StatusTone } from '@/components/status-badge';
import { EmptyRow, LoadMore, TableCard } from '@/components/table-card';
import { roleLabels } from '@/lib/domain/permissions';
import { formatDateTime, formatDuration, formatHuf, formatSeats, formatTimestamp, formatUntil } from '@/lib/format';
import { actorTypeLabels, auditActionLabels, hrEventTypeLabels, label } from '@/lib/i18n/labels';
import { seatReasonLabel } from '@/lib/i18n/reasons';
import { sameAuditStep, type listAuditEntries } from '@/lib/services/audit-queries';

type Entry = Awaited<ReturnType<typeof listAuditEntries>>['entries'][number];

type EventHref = (event: NonNullable<Entry['causeEvent']>, companyId: string | null) => string;

function flatten(data: Record<string, unknown> | null): [string, string][] {
  const pairs: [string, string][] = [];
  function walk(key: string, value: unknown) {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      pairs.push([key, value.map(item => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ')]);
    } else if (typeof value === 'object') {
      for (const [child, childValue] of Object.entries(value)) walk(key ? `${key}.${child}` : child, childValue);
    } else {
      pairs.push([key, String(value)]);
    }
  }
  walk('', data);
  return pairs;
}

const seatTone: Record<string, StatusTone> = {
  'seat.assigned': 'success',
  'seat.queued': 'warning',
  'seat.requeued': 'warning',
  'seat.revoked': 'danger',
  'seat.cancelled': 'danger',
};

const DEFAULT_REASON = 'RULE_MATCHED';

function groupEntries(entries: Entry[]): Entry[][] {
  const groups: Entry[][] = [];
  for (const entry of entries) {
    const current = groups.at(-1);
    if (current && sameAuditStep(current[0], entry)) current.push(entry);
    else groups.push([entry]);
  }
  return groups.map(members => [...members].sort((a, b) => a.id - b.id));
}

const gridBase = 'grid grid-cols-1 items-baseline gap-x-4 gap-y-0.5 xl:[&>*]:order-none';

const layouts = {
  company: {
    grid: 'xl:grid-cols-[9.5rem_8.5rem_minmax(0,1fr)_12rem_10rem_1rem]',
    details: 'xl:pl-[21.25rem]',
  },
  default: {
    grid: 'xl:grid-cols-[9.5rem_minmax(0,1fr)_13rem_11rem_1rem]',
    details: 'xl:pl-[11.75rem]',
  },
};

function EmployeeRef({ employee, href }: { employee: NonNullable<Entry['employee']>; href?: string }) {
  const name = employee.name ?? <span className="text-muted-foreground">Név nélkül</span>;
  return (
    <>
      {href ? (
        <Link href={href} className="hover:underline">
          {name}
        </Link>
      ) : (
        name
      )}{' '}
      <Ident className="ml-1">{employee.hrId}</Ident>
    </>
  );
}

function Action({ entry }: { entry: Entry }) {
  const tone = seatTone[entry.action];
  const text = label(auditActionLabels, entry.action);
  return (
    <>
      {tone ? (
        <StatusBadge tone={tone} className="align-top text-foreground" title={entry.action}>
          {text}
        </StatusBadge>
      ) : (
        <span title={entry.action}>{text}</span>
      )}
      {entry.reason && entry.reason !== DEFAULT_REASON && (
        <span
          className={cn('font-normal text-muted-foreground max-xl:block', tone && 'max-xl:pl-3')}
          title={entry.reason}
        >
          <span className="max-xl:hidden"> · </span>
          {seatReasonLabel(entry.reason)}
        </span>
      )}
    </>
  );
}

function field(data: Record<string, unknown> | null, path: string): string | number | null {
  let value: unknown = data;
  for (const key of path.split('.')) {
    if (typeof value !== 'object' || value === null) return null;
    value = (value as Record<string, unknown>)[key];
  }
  return typeof value === 'string' || typeof value === 'number' ? value : null;
}

function payloadFacts(entry: Entry): [string, React.ReactNode][] {
  const { data } = entry;
  const text = (path: string) => {
    const value = field(data, path);
    return typeof value === 'string' && value ? value : null;
  };
  const number = (path: string) => {
    const value = field(data, path);
    return typeof value === 'number' ? value : null;
  };
  const facts: [string, React.ReactNode][] = [];

  if (entry.productName) facts.push([entry.companyId ? 'Szoftver' : 'Termék', entry.productName]);
  const name = text('name');
  if (name) facts.push(['Név', name]);
  const email = text('email');
  if (email) facts.push(['E-mail-cím', email]);
  const role = text('role');
  if (role) facts.push(['Szerepkör', label(roleLabels, role)]);

  const jobRole = text('after.jobRole') ?? text('jobRole');
  const jobRoleBefore = text('before.jobRole');
  if (jobRole) {
    facts.push(['Munkakör', jobRoleBefore && jobRoleBefore !== jobRole ? `${jobRoleBefore} → ${jobRole}` : jobRole]);
  }
  const occurredAt = text('occurredAt');
  if (occurredAt)
    facts.push(['A változás időpontja', <Numeric key="occurredAt">{formatTimestamp(occurredAt)}</Numeric>]);
  const eligibleSince = text('eligibleSince');
  if (eligibleSince) {
    facts.push(['Mióta jár neki', <Numeric key="eligibleSince">{formatTimestamp(eligibleSince)}</Numeric>]);
  }

  const seatCount = number('seatCount');
  if (seatCount !== null) facts.push(['Helyek', <Numeric key="seatCount">{formatSeats(seatCount)}</Numeric>]);
  const durationDays = number('durationDays');
  if (durationDays !== null) facts.push(['Időtartam', formatDuration(durationDays)]);
  const validUntil = text('validUntil');
  if (validUntil) facts.push(['Érvényes', <Numeric key="validUntil">{formatUntil(validUntil)}</Numeric>]);
  const priceHuf = number('priceHuf');
  if (priceHuf !== null) facts.push(['Ár', <Numeric key="priceHuf">{formatHuf(priceHuf)}</Numeric>]);
  const keyLast4 = text('keyLast4');
  if (keyLast4) facts.push(['Kulcs vége', <Numeric key="keyLast4">…{keyLast4}</Numeric>]);
  return facts;
}

function inSentence(text: string): string {
  return /^\p{Lu}{2}/u.test(text) ? text : text.toLowerCase();
}

const payloadKeyLabels: Record<string, string> = {
  productId: 'Termékazonosító',
  planId: 'Csomagazonosító',
  licenseId: 'Licencazonosító',
  orderId: 'Rendelésazonosító',
  employeeId: 'Munkavállaló-azonosító',
  userId: 'Felhasználóazonosító',
  membershipId: 'Tagságazonosító',
  invitationId: 'Meghívóazonosító',
};

function Numeric({ children }: { children: React.ReactNode }) {
  return <span className="nums">{children}</span>;
}

function entryFacts(entry: Entry, cause?: Entry, eventHref?: EventHref): React.ReactNode {
  const actorType = label(actorTypeLabels, entry.actorType);
  const time = formatTimestamp(entry.createdAt);
  const showTime = !cause || formatTimestamp(cause.createdAt) !== time;
  const payload = payloadFacts(entry);
  if (cause && !showTime && !entry.reason && payload.length === 0) return null;
  const href = entry.causeEvent && eventHref?.(entry.causeEvent, entry.companyId);
  return (
    <FactList>
      {showTime && (
        <Fact term="Időpont">
          <Numeric>{time}</Numeric>
        </Fact>
      )}
      {!cause && (
        <Fact term="Végrehajtó">{entry.actorName ? `${entry.actorName} (${inSentence(actorType)})` : actorType}</Fact>
      )}
      {entry.reason && <Fact term="Ok">{seatReasonLabel(entry.reason)}</Fact>}
      {!cause && (
        <Fact term="Kiváltó HR-esemény">
          {entry.causeEvent ? (
            <>
              {href ? (
                <Link
                  href={href}
                  className="rounded-sm underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground"
                >
                  {label(hrEventTypeLabels, entry.causeEvent.type)}
                </Link>
              ) : (
                label(hrEventTypeLabels, entry.causeEvent.type)
              )}{' '}
              <Ident className="ml-1">{entry.causeEvent.hrId}</Ident>
            </>
          ) : (
            <span className="text-muted-foreground">nincs</span>
          )}
        </Fact>
      )}
      {payload.map(([term, value]) => (
        <Fact key={term} term={term}>
          {value}
        </Fact>
      ))}
    </FactList>
  );
}

function TechFacts({ entry, showEvent }: { entry: Entry; showEvent: boolean }) {
  return (
    <FactList className="gap-y-1.5">
      <Fact term="Művelet kódja">
        <TechValue>{entry.action}</TechValue>
      </Fact>
      {entry.reason && (
        <Fact term="Ok kódja">
          <TechValue>{entry.reason}</TechValue>
        </Fact>
      )}
      {entry.targetType && (
        <Fact term="Érintett elem">
          <TechValue>
            {entry.targetType}
            {entry.targetId ? ` ${entry.targetId}` : ''}
          </TechValue>
        </Fact>
      )}
      {showEvent && entry.causeEventId && (
        <Fact term="Eseményazonosító">
          <TechValue>{entry.causeEventId}</TechValue>
        </Fact>
      )}
      {flatten(entry.data).map(([key, value]) => (
        <Fact key={key} term={payloadKeyLabels[key] ?? key} code={!(key in payloadKeyLabels)}>
          <TechValue>{value}</TechValue>
        </Fact>
      ))}
    </FactList>
  );
}

function StepItem({
  entries,
  showCompany,
  employeeHref,
  eventHref,
}: {
  entries: Entry[];
  showCompany?: boolean;
  employeeHref?: (employeeId: string, companyId: string | null) => string;
  eventHref?: EventHref;
}) {
  const layout = showCompany ? layouts.company : layouts.default;
  const grid = cn(gridBase, layout.grid);
  const [first, ...rest] = entries;
  const actorType = label(actorTypeLabels, first.actorType);
  const actor = first.actorName ?? actorType;
  const time = formatDateTime(first.createdAt);
  const company = first.companyName ?? 'Platform';
  return (
    <li className="border-b border-border/70 last:border-0">
      <details className="group/step open:bg-muted/40">
        <summary className="relative block cursor-pointer list-none px-5 py-3 pr-11 transition-colors outline-none hover:bg-muted/40 focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset xl:pr-5 dark:hover:bg-muted/70 [&::-webkit-details-marker]:hidden">
          <span className={grid}>
            <span className="nums hidden whitespace-nowrap text-muted-foreground xl:block">{time}</span>
            {showCompany && (
              <span className={cn('hidden truncate xl:block', !first.companyName && 'text-muted-foreground')}>
                {company}
              </span>
            )}
            <span className="order-1 min-w-0 font-medium text-pretty">
              <Action entry={first} />
            </span>
            <span className="order-2 min-w-0 truncate text-[13px] empty:hidden xl:text-sm xl:empty:block">
              {first.employee ? (
                <EmployeeRef employee={first.employee} href={employeeHref?.(first.employee.id, first.companyId)} />
              ) : (
                <span className="hidden text-muted-foreground xl:inline">–</span>
              )}
            </span>
            <span className="hidden min-w-0 truncate text-muted-foreground xl:block" title={actorType}>
              {actor}
            </span>
            <MetaLine className="order-3 min-w-0 xl:hidden" items={[time, showCompany && company, actor]} />
            <ChevronDownIcon
              aria-hidden
              className="absolute top-3.5 right-5 size-4 text-muted-foreground/60 transition-transform group-open/step:rotate-180 xl:static xl:self-center"
            />
          </span>
          {rest.map(entry => {
            const later = formatDateTime(entry.createdAt);
            return (
              <span key={entry.id} className={cn(grid, 'mt-1.5')}>
                <span className="nums order-2 text-[13px] whitespace-nowrap text-muted-foreground empty:hidden xl:text-sm xl:empty:block">
                  {later !== time && later}
                </span>
                {showCompany && <span className="hidden xl:block" />}
                <span className="order-1 flex min-w-0 items-baseline gap-2 xl:col-span-3">
                  <CornerDownRightIcon
                    aria-hidden
                    className="mt-[3px] size-3.5 shrink-0 self-start text-muted-foreground/50"
                  />
                  <span className="min-w-0 xl:truncate">
                    <Action entry={entry} />
                  </span>
                </span>
              </span>
            );
          })}
        </summary>
        <div className={cn('flex flex-col gap-3 px-5 pt-1 pb-4 text-[13px]', layout.details)}>
          {entryFacts(first, undefined, eventHref)}
          {rest.map(entry => {
            const own = entryFacts(entry, first);
            return (
              own && (
                <div key={entry.id} className="flex flex-col gap-1">
                  <div className="font-medium">{label(auditActionLabels, entry.action)}</div>
                  {own}
                </div>
              )
            );
          })}
          <TechnicalDetails>
            {entries.map(entry => (
              <div key={entry.id} className="flex flex-col gap-1.5">
                {entries.length > 1 && (
                  <div className="text-muted-foreground">{label(auditActionLabels, entry.action)}</div>
                )}
                <TechFacts entry={entry} showEvent={entry === first} />
              </div>
            ))}
          </TechnicalDetails>
        </div>
      </details>
    </li>
  );
}

export function AuditTable({
  entries,
  filtered = false,
  showCompany,
  employeeHref,
  eventHref,
  more,
}: {
  entries: Entry[];
  filtered?: boolean;
  showCompany?: boolean;
  employeeHref?: (employeeId: string, companyId: string | null) => string;
  eventHref?: EventHref;
  more?: { href: string; shown: number; total: number } | null;
}) {
  if (entries.length === 0) {
    return filtered ? (
      <TableCard>
        <EmptyRow>Ezekre a szűrőkre nincs találat.</EmptyRow>
      </TableCard>
    ) : (
      <EmptyState
        icon={<ScrollTextIcon />}
        title="Még nincs bejegyzés"
        description="Minden változás azonnal megjelenik itt."
      />
    );
  }

  const layout = showCompany ? layouts.company : layouts.default;

  return (
    <TableCard footer={more && <LoadMore href={more.href} shown={more.shown} total={more.total} unit="bejegyzés" />}>
      <div
        className={cn(
          gridBase,
          layout.grid,
          'hidden h-10 items-center border-b px-5 text-xs font-medium text-muted-foreground xl:grid',
        )}
      >
        <span>Időpont</span>
        {showCompany && <span>Cég</span>}
        <span>Mi történt</span>
        <span>Munkavállaló</span>
        <span>Végrehajtó</span>
        <span className="sr-only">Részletek</span>
      </div>
      <ul className="text-sm">
        {groupEntries(entries).map(members => (
          <StepItem
            key={members[0].id}
            entries={members}
            showCompany={showCompany}
            employeeHref={employeeHref}
            eventHref={eventHref}
          />
        ))}
      </ul>
    </TableCard>
  );
}
