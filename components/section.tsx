import { cn } from 'cn';

export function Section({
  title,
  count,
  description,
  actions,
  children,
  className,
}: {
  title: React.ReactNode;
  count?: number;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <div className="space-y-0.5">
        <div className={cn('flex items-center justify-between gap-3', actions && 'min-h-8')}>
          <h2 className="min-w-0 text-base font-semibold tracking-tight">
            {title}
            {count !== undefined && <span className="nums ml-2 font-normal text-muted-foreground">{count}</span>}
          </h2>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
        {description && <p className="max-w-[68ch] text-sm text-pretty text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
