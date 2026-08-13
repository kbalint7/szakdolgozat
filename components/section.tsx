import { cn } from '@/lib/utils';

export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description && <p className="max-w-3xl text-sm text-pretty text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
