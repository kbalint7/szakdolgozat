import { cn } from 'cn';
import { ArmchairIcon, ChevronRightIcon, InboxIcon, PencilLineIcon, UserRoundIcon } from 'lucide-react';

import { Mono } from '@/components/code';
import { MetaLine } from '@/components/meta-line';
import { StatusBadge, type StatusTone } from '@/components/status-badge';
import { WithReason } from '@/components/with-reason';
import { formatDate, formatDateTime } from '@/lib/format';
import {
  auditActionLabels,
  hrEventSourceLabels,
  hrEventStatusLabels,
  hrEventTypeLabels,
  label,
} from '@/lib/i18n/labels';
import { seatReasonLabel } from '@/lib/i18n/reasons';
import type { TimelineItem } from '@/lib/services/employees';

type EventItem = Extract<TimelineItem, { kind: 'event' }>;
type DecisionItem = Extract<TimelineItem, { kind: 'decision' }>;

function decisionReason(item: DecisionItem) {
  return item.action.startsWith('seat.') && item.reason ? seatReasonLabel(item.reason) : null;
}

function describeDecision(item: DecisionItem) {
  const data = item.data ?? {};
  const before = data.before as { status: string; jobRole: string } | null | undefined;
  const after = data.after as { status: string; jobRole: string } | undefined;
  switch (item.action) {
    case 'employee.hired':
      return data.created
        ? `Új munkavállaló, a munkaköre ${after?.jobRole}.`
        : `Belépett, a munkaköre ${after?.jobRole}.`;
    case 'employee.rehired':
      return `Újra belépett, a munkaköre ${after?.jobRole}. Ha várnia kell egy szoftverre, a sor végére kerül.`;
    case 'employee.role_changed':
      return data.created
        ? `Munkakörváltáskor vettük fel, mert a belépéséről nem kaptunk eseményt. A munkaköre ${after?.jobRole}.`
        : `A munkaköre ${before?.jobRole} helyett ${after?.jobRole} lett.`;
    case 'employee.terminated':
      return data.created ? 'Kilépettként vettük fel, mert a korábbi eseményeit nem kaptuk meg.' : 'Kilépett.';
    case 'hr_event.stale':
      return 'Ennél frissebb adatunk van a munkavállalóról, ezért nem változott semmi.';
    case 'seat.queued':
      return `${item.productName}: várólistára került`;
    case 'seat.assigned':
      return `${item.productName}: helyet kapott`;
    case 'seat.revoked':
      return `${item.productName}: elvesztette a helyét`;
    case 'seat.cancelled':
      return `${item.productName}: lekerült a várólistáról`;
    case 'seat.requeued':
      return `${item.productName}: elvesztette a helyét, és a várólistán oda került vissza, ahol korábban állt`;
    default:
      return label(auditActionLabels, item.action);
  }
}

function decisionDot(action: string): string {
  switch (action) {
    case 'seat.assigned':
      return 'bg-success';
    case 'seat.revoked':
    case 'seat.cancelled':
      return 'bg-destructive';
    case 'seat.queued':
    case 'seat.requeued':
      return 'bg-warning';
    default:
      return 'bg-muted-foreground/40';
  }
}

const eventTone: Record<string, StatusTone> = {
  processed: 'success',
  pending: 'info',
  stale: 'neutral',
  failed: 'danger',
};

type Group = { key: string; event: EventItem | null; decisions: DecisionItem[] };

function groupItems(items: TimelineItem[]): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;
  for (const item of items) {
    if (item.kind === 'event') {
      current = { key: `event-${item.id}`, event: item, decisions: [] };
      groups.push(current);
    } else if (current?.event && item.cause?.eventId === current.event.eventId) {
      current.decisions.push(item);
    } else if (
      current &&
      !current.event &&
      !item.cause &&
      !current.decisions[0].cause &&
      item.at.getTime() - current.decisions[0].at.getTime() < 2000
    ) {
      current.decisions.push(item);
    } else {
      current = { key: `decision-${item.id}`, event: null, decisions: [item] };
      groups.push(current);
    }
  }
  return groups;
}

function groupHead(decisions: DecisionItem[]): { title: string; icon: React.ReactNode } {
  if (decisions.every(item => item.action.startsWith('seat.')))
    return { title: 'Helyek újraszámolása', icon: <ArmchairIcon /> };
  if (decisions.every(item => /^(invitation|membership|employee\.(un)?linked)/.test(item.action)))
    return { title: 'Fiók és tagság', icon: <UserRoundIcon /> };
  return { title: 'Változás', icon: <PencilLineIcon /> };
}

function Decision({ item, showTime, showCause }: { item: DecisionItem; showTime: boolean; showCause: boolean }) {
  return (
    <li className="flex gap-2.5 text-sm">
      <span aria-hidden className={cn('mt-[7px] size-1.5 shrink-0 rounded-full', decisionDot(item.action))} />
      <div className="min-w-0">
        <WithReason reason={decisionReason(item)}>{describeDecision(item)}</WithReason>
        <MetaLine
          className="mt-0.5"
          items={[
            showTime && formatDateTime(item.at),
            showCause && item.cause && (
              <span className="whitespace-normal">
                kiváltó HR-esemény: <Mono>{item.cause.eventId}</Mono>
              </span>
            ),
          ]}
        />
      </div>
    </li>
  );
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Még nincs bejegyzés.</p>;
  }
  return (
    <ol className="flex flex-col">
      {groupItems(items).map(({ key, event, decisions }) => {
        const head = event ? null : groupHead(decisions);
        return (
          <li
            key={key}
            className="relative flex gap-3.5 pb-7 before:absolute before:top-9 before:bottom-1 before:left-4 before:w-px before:bg-border last:pb-0 last:before:hidden"
          >
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4',
                event?.status === 'failed'
                  ? 'bg-destructive/10 text-destructive'
                  : event
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground',
              )}
            >
              {event ? <InboxIcon /> : head!.icon}
            </span>
            <div className="min-w-0 flex-1 pt-1.5">
              {event ? (
                <>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 leading-5">
                    <span className="font-medium">HR-esemény: {label(hrEventTypeLabels, event.type)}</span>
                    {event.status !== 'processed' && (
                      <StatusBadge tone={eventTone[event.status] ?? 'neutral'}>
                        {label(hrEventStatusLabels, event.status)}
                      </StatusBadge>
                    )}
                  </div>
                  <MetaLine
                    className="mt-0.5"
                    items={[
                      formatDateTime(event.at),
                      label(hrEventSourceLabels, event.source),
                      Math.abs(event.occurredAt.getTime() - event.at.getTime()) > 60_000 &&
                        `a változás napja: ${formatDate(event.occurredAt)}`,
                      event.attempts > 1 && `${event.attempts}. próbálkozás`,
                    ]}
                  />
                  {event.status === 'failed' && (
                    <p className="mt-1.5 text-sm text-pretty">
                      {event.nextAttemptAt
                        ? 'Nem sikerült feldolgozni. Hamarosan újra megpróbáljuk.'
                        : 'Nem sikerült feldolgozni, és automatikusan már nem próbáljuk újra.'}
                    </p>
                  )}
                  {event.lastError && (
                    <details className="group mt-1.5 text-[13px] text-muted-foreground">
                      <summary className="-ml-0.5 flex w-fit cursor-pointer list-none items-center gap-1 rounded-sm hover:text-foreground focus-visible:text-foreground [&::-webkit-details-marker]:hidden">
                        <ChevronRightIcon aria-hidden className="size-3.5 transition-transform group-open:rotate-90" />
                        Technikai részletek
                      </summary>
                      <div className="mt-1.5 flex flex-col items-start gap-1.5">
                        <Mono>{event.eventId}</Mono>
                        <Mono>{event.lastError}</Mono>
                      </div>
                    </details>
                  )}
                </>
              ) : (
                <>
                  <div className="leading-5 font-medium">{head!.title}</div>
                  <MetaLine className="mt-0.5" items={[formatDateTime(decisions[0].at)]} />
                </>
              )}
              {decisions.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2">
                  {decisions.map(item => (
                    <Decision
                      key={item.id}
                      item={item}
                      showTime={Boolean(event) && item.at.getTime() - event!.at.getTime() > 60_000}
                      showCause={!event}
                    />
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
