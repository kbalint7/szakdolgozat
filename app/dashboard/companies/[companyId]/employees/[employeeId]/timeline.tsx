import { cn } from 'cn';
import {
  ArmchairIcon,
  ArmchairIcon as SeatIcon,
  HourglassIcon,
  InboxIcon,
  UserRoundCogIcon,
  XIcon,
} from 'lucide-react';

import { Mono } from '@/components/code';
import { StatusBadge, type StatusTone } from '@/components/status-badge';
import { formatTimestamp } from '@/lib/format';
import {
  auditActionLabels,
  hrEventSourceLabels,
  hrEventStatusLabels,
  hrEventTypeLabels,
  label,
} from '@/lib/i18n/labels';
import { seatReasonLabel } from '@/lib/i18n/reasons';
import type { TimelineItem } from '@/lib/services/employees';

function describeDecision(item: Extract<TimelineItem, { kind: 'decision' }>) {
  const data = item.data ?? {};
  const before = data.before as { status: string; jobRole: string } | null | undefined;
  const after = data.after as { status: string; jobRole: string } | undefined;
  switch (item.action) {
    case 'employee.hired':
      return data.created ? `Felvéve, munkakör: ${after?.jobRole}` : `Belépett, munkakör: ${after?.jobRole}`;
    case 'employee.rehired':
      return `Újra belépett, munkakör: ${after?.jobRole} (a várólistán újra hátulra kerül)`;
    case 'employee.role_changed':
      return data.created
        ? `Munkakörváltásból rögzítve (a belépésről nem érkezett esemény), munkakör: ${after?.jobRole}`
        : `Munkakör: ${before?.jobRole} → ${after?.jobRole}`;
    case 'employee.terminated':
      return data.created ? 'Kilépettként rögzítve (a korábbi események nem érkeztek meg)' : 'Kilépett';
    case 'hr_event.stale':
      return `Elavult esemény figyelmen kívül hagyva: ${String(data.eventId)} régebbi, mint az ismert állapot`;
    case 'seat.queued':
      return `${item.productName}: várólistára került — ${seatReasonLabel(item.reason)}`;
    case 'seat.assigned':
      return `${item.productName}: helyet kapott — ${seatReasonLabel(item.reason)}`;
    case 'seat.revoked':
      return `${item.productName}: hely visszavonva — ${seatReasonLabel(item.reason)}`;
    case 'seat.cancelled':
      return `${item.productName}: várólistáról törölve — ${seatReasonLabel(item.reason)}`;
    case 'seat.requeued':
      return `${item.productName}: hely visszavonva és visszakerült a várólistára az eredeti sorrendjével — ${seatReasonLabel(item.reason)}`;
    default:
      return label(auditActionLabels, item.action);
  }
}

function marker(item: TimelineItem): { icon: React.ReactNode; classes: string } {
  if (item.kind === 'event') {
    return {
      icon: <InboxIcon />,
      classes:
        item.status === 'failed'
          ? 'bg-destructive/10 text-destructive ring-destructive/30'
          : 'bg-info/12 text-info ring-info/30',
    };
  }
  switch (item.action) {
    case 'seat.assigned':
      return { icon: <SeatIcon />, classes: 'bg-success/12 text-success ring-success/30' };
    case 'seat.revoked':
    case 'seat.cancelled':
      return { icon: <XIcon />, classes: 'bg-destructive/10 text-destructive ring-destructive/30' };
    case 'seat.queued':
    case 'seat.requeued':
      return { icon: <HourglassIcon />, classes: 'bg-warning/15 text-warning ring-warning/40' };
    default:
      return item.action.startsWith('seat.')
        ? { icon: <ArmchairIcon />, classes: 'bg-muted text-muted-foreground ring-border' }
        : { icon: <UserRoundCogIcon />, classes: 'bg-muted text-muted-foreground ring-border' };
  }
}

const eventTone: Record<string, StatusTone> = {
  processed: 'success',
  pending: 'info',
  stale: 'neutral',
  failed: 'danger',
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Még nincs bejegyzés.</p>;
  }
  return (
    <ol className="flex flex-col">
      {items.map(item => {
        const { icon, classes } = marker(item);
        return (
          <li
            key={`${item.kind}-${item.id}`}
            className="relative flex gap-3 pb-5 before:absolute before:top-7 before:bottom-0 before:left-3.5 before:w-px before:bg-border last:pb-0 last:before:hidden"
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full ring-1 [&_svg]:size-3.5',
                classes,
              )}
            >
              {icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="nums text-xs text-muted-foreground">{formatTimestamp(item.at)}</div>
              {item.kind === 'event' ? (
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">HR-esemény: {label(hrEventTypeLabels, item.type)}</span>
                    <StatusBadge tone={eventTone[item.status] ?? 'neutral'}>
                      {label(hrEventStatusLabels, item.status)}
                    </StatusBadge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <Mono>{item.eventId}</Mono> · történt: {formatTimestamp(item.occurredAt)} ·{' '}
                    {label(hrEventSourceLabels, item.source)}
                    {item.attempts > 1 && ` · ${item.attempts}. kísérlet`}
                  </div>
                  {item.lastError && <div className="text-xs text-destructive">{item.lastError}</div>}
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="text-sm">{describeDecision(item)}</div>
                  {item.cause && (
                    <div className="text-xs text-muted-foreground">
                      kiváltó esemény: <Mono>{item.cause.eventId}</Mono>, történt:{' '}
                      {formatTimestamp(item.cause.occurredAt)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
