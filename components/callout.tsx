import { cn } from 'cn';
import { TriangleAlertIcon } from 'lucide-react';

export function Callout({
  tone = 'note',
  title,
  children,
  className,
}: {
  tone?: 'note' | 'warning';
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  if (tone === 'warning') {
    return (
      <div
        className={cn(
          'flex max-w-[46rem] gap-3 rounded-xl bg-warning/8 px-4 py-3.5 text-sm ring-1 ring-warning/25 dark:bg-warning/10',
          className,
        )}
      >
        <TriangleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
        <div className="min-w-0 space-y-0.5 text-pretty">
          {title && <div className="font-medium text-foreground">{title}</div>}
          <div className="leading-relaxed text-muted-foreground">{children}</div>
        </div>
      </div>
    );
  }
  return (
    <div className={cn('max-w-[46rem] border-l-2 border-border py-0.5 pl-4 text-[13px] text-pretty', className)}>
      {title && <div className="mb-1 font-medium text-foreground">{title}</div>}
      <div className="leading-relaxed text-muted-foreground [&_code]:text-foreground">{children}</div>
    </div>
  );
}
