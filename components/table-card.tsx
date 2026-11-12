import { cn } from 'cn';
import { ChevronRightIcon } from 'lucide-react';

import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { TableCell, TableHead } from '@/components/ui/table';

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
        'overflow-hidden rounded-xl bg-card text-card-foreground shadow-card ring-1 ring-border',
        className,
      )}
    >
      {children}
      {footer && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border/70 px-4 py-2.5 text-[13px] text-muted-foreground">
          {footer}
        </div>
      )}
    </div>
  );
}

export function TwoLine({
  title,
  sub,
  className,
}: {
  title: React.ReactNode;
  sub: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="leading-5 font-medium">{title}</div>
      <div className="text-[13px] leading-4 text-muted-foreground">{sub}</div>
    </div>
  );
}

export function ChevronCell({ className }: { className?: string }) {
  return (
    <TableCell className={cn('w-px pr-4 pl-0 md:w-auto', className)}>
      <ChevronRightIcon aria-hidden className="ml-auto size-4 text-muted-foreground/60" />
    </TableCell>
  );
}

export function ActionHead({ label = 'Műveletek', className }: { label?: string; className?: string }) {
  return (
    <TableHead className={cn('w-px md:w-auto', className)}>
      <span className="sr-only">{label}</span>
    </TableHead>
  );
}

export function LoadMore({
  href,
  shown,
  total,
  unit,
}: {
  href: string;
  shown?: number;
  total?: number;
  unit?: string;
}) {
  return (
    <div className="mx-auto flex items-center gap-3">
      <Link
        href={href}
        scroll={false}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'text-foreground')}
      >
        Továbbiak betöltése
      </Link>
      {shown !== undefined && total !== undefined && (
        <span className="nums">
          {shown} / {total}
          {unit && ` ${unit}`}
        </span>
      )}
    </div>
  );
}

export function EmptyRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-5 py-5 text-sm text-pretty text-muted-foreground', className)}>{children}</div>;
}
