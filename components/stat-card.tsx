import { cn } from 'cn';
import { ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';

export type Tone = 'default' | 'warning' | 'danger';

const valueTone: Record<Tone, string> = {
  default: '',
  warning: 'text-warning',
  danger: 'text-destructive',
};

export function Stat({
  label,
  value,
  tone = 'default',
  href,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: Tone;
  href?: string;
}) {
  const body = (
    <>
      <div className="min-w-0 text-[13px] text-muted-foreground max-sm:text-sm max-sm:text-foreground">{label}</div>
      <div className={cn('nums text-xl leading-7 font-semibold tracking-tight sm:mt-1 sm:text-2xl', valueTone[tone])}>
        {value}
      </div>
    </>
  );
  const base =
    'flex items-center justify-between gap-4 bg-card px-5 py-3 sm:flex-col sm:items-start sm:justify-start sm:gap-0 sm:py-4';
  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          'group relative transition-colors outline-none hover:bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] focus-visible:bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset max-sm:pr-10',
        )}
      >
        {body}
        <ChevronRightIcon
          aria-hidden
          className="absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground/60 transition-[translate,color] group-hover:translate-x-0.5 group-hover:text-foreground sm:top-4 sm:translate-y-0.5"
        />
      </Link>
    );
  }
  return <div className={base}>{body}</div>;
}

export function StatStrip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-border shadow-card ring-1 ring-border sm:auto-cols-fr sm:grid-flow-col',
        className,
      )}
    >
      {children}
    </div>
  );
}
