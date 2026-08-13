import { cn } from '@/lib/utils';

export function TableCard({
  children,
  footer,
  className,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="table-card"
      className={cn(
        'overflow-hidden rounded-xl bg-card text-card-foreground shadow-card ring-1 ring-foreground/8',
        className,
      )}
    >
      {children}
      {footer && (
        <div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-3 py-2 text-sm">{footer}</div>
      )}
    </div>
  );
}
