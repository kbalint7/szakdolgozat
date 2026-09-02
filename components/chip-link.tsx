import Link from 'next/link';

import { cn } from '@/lib/utils';

export function ChipLink({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors',
        active
          ? 'border-primary/30 bg-primary/10 font-medium text-primary'
          : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
      {count !== undefined && (
        <span
          className={cn(
            'nums rounded-full px-1.5 text-[11px]',
            active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

export function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <nav className="flex flex-wrap gap-1.5" aria-label={label}>
      {children}
    </nav>
  );
}
