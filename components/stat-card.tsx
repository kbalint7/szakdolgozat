import { cn } from 'cn';
import Link from 'next/link';

export type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

const toneClasses: Record<Tone, string> = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-info/12 text-info',
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  href,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm text-muted-foreground">{label}</div>
        {icon && (
          <div
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4',
              toneClasses[tone],
            )}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="nums mt-1 text-2xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </>
  );
  const base = 'flex flex-col rounded-xl bg-card p-4 text-card-foreground shadow-card ring-1 ring-foreground/8';
  if (href) {
    return (
      <Link href={href} className={cn(base, 'transition-shadow hover:shadow-md hover:ring-primary/40', className)}>
        {body}
      </Link>
    );
  }
  return <div className={cn(base, className)}>{body}</div>;
}

export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>{children}</div>;
}
