import { cn } from 'cn';

const MAX_SQUARES = 50;

const sizes = {
  default: { cell: 12, gap: 4, radius: 'rounded-[30%]' },
  lg: { cell: 16, gap: 6, radius: 'rounded-[30%]' },
};

const ONE_ROW = 25;

type SeatNumbers = {
  assigned: number;
  capacity: number;
  waiting?: number;
};

export function SeatMap({
  assigned,
  capacity,
  waiting = 0,
  label,
  size = 'default',
  className,
}: SeatNumbers & {
  label: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const used = Math.min(assigned, capacity);
  const description = `${label}: ${capacity} helyből ${used} kiosztva${waiting > 0 ? `, ${waiting} ember vár` : ''}`;

  if (capacity === 0 || capacity + waiting > MAX_SQUARES) {
    const ratio = capacity === 0 ? 0 : used / capacity;
    return (
      <div
        role="img"
        aria-label={description}
        className={cn('h-2 w-60 max-w-full overflow-hidden rounded-full bg-primary/12 dark:bg-primary/25', className)}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
    );
  }

  const { cell, gap, radius } = sizes[size];
  const total = capacity + waiting;
  const perRow = total <= ONE_ROW ? total : Math.ceil(total / 2);
  const square = cn('aspect-square w-full', radius);
  return (
    <div
      role="img"
      aria-label={description}
      className={cn('grid w-full min-w-0', className)}
      style={{
        gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))`,
        maxWidth: perRow * cell + (perRow - 1) * gap,
        gap,
      }}
    >
      {Array.from({ length: capacity }, (_, i) => (
        <span key={i} className={cn(square, i < used ? 'bg-primary' : 'bg-primary/12 dark:bg-primary/25')} />
      ))}
      {Array.from({ length: waiting }, (_, i) => (
        <span
          key={`w${i}`}
          className={cn(square, 'border border-dashed border-warning bg-warning/15 dark:bg-warning/25')}
        />
      ))}
    </div>
  );
}

export function SeatCount({ assigned, capacity, waiting = 0, className }: SeatNumbers & { className?: string }) {
  return (
    <span className={cn('nums text-[13px] whitespace-nowrap text-muted-foreground', className)}>
      <span className="font-medium text-foreground">{Math.min(assigned, capacity)}</span> / {capacity} hely
      {waiting > 0 && <span className="text-warning"> · {waiting} vár</span>}
    </span>
  );
}

export function SeatMeter({
  assigned,
  capacity,
  waiting = 0,
  label,
  size = 'default',
  className,
}: SeatNumbers & { label: string; size?: keyof typeof sizes; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2', className)}>
      <SeatMap assigned={assigned} capacity={capacity} waiting={waiting} label={label} size={size} />
      <SeatCount assigned={assigned} capacity={capacity} waiting={waiting} />
    </div>
  );
}

export function SeatLegend({ free, waiting, className }: { free: boolean; waiting: boolean; className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted-foreground', className)}>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[3px] bg-primary" /> kiosztott hely
      </span>
      {free && (
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-primary/12 dark:bg-primary/25" /> szabad hely
        </span>
      )}
      {waiting && (
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] border border-dashed border-warning bg-warning/15 dark:bg-warning/25" />{' '}
          várólistán
        </span>
      )}
    </div>
  );
}
