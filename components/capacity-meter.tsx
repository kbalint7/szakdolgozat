import { cn } from '@/lib/utils';

export function CapacityMeter({
  assigned,
  capacity,
  waiting = 0,
  label,
  size = 'default',
  className,
}: {
  assigned: number;
  capacity: number;
  waiting?: number;
  label: string;
  size?: 'default' | 'sm';
  className?: string;
}) {
  const ratio = capacity === 0 ? 0 : Math.min(1, assigned / capacity);
  const full = capacity === 0 || assigned >= capacity;
  const tone =
    full && waiting > 0 ? 'bg-destructive' : full ? 'bg-warning' : ratio >= 0.8 ? 'bg-warning' : 'bg-success';
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-muted', size === 'sm' ? 'h-1.5' : 'h-2', className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={capacity}
      aria-valuenow={Math.min(assigned, capacity)}
      aria-label={`${label} kihasználtsága`}
    >
      <div
        className={cn('h-full rounded-full transition-[width]', tone)}
        style={{ width: `${Math.round(ratio * 100)}%` }}
      />
    </div>
  );
}
