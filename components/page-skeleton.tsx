import { cn } from 'cn';

import { Skeleton } from '@/components/ui/skeleton';

const lineSizes = {
  xs: ['h-4', 'h-2.5'],
  label: ['h-3.5', 'h-2.5'],
  sm: ['h-5', 'h-3'],
  title: ['h-5.5', 'h-3.5'],
  base: ['h-6', 'h-3.5'],
  lg: ['h-7', 'h-4'],
  xl: ['h-7', 'h-4.5'],
  '2xl': ['h-8', 'h-5'],
  '3xl': ['h-9', 'h-6'],
  chip: ['h-7', 'h-6'],
} as const;

export function SkeletonLine({
  size = 'sm',
  w = 'w-32',
  className,
}: {
  size?: keyof typeof lineSizes;
  w?: string;
  className?: string;
}) {
  const [line, bar] = lineSizes[size];
  return (
    <div className={cn('flex items-center', line, className)}>
      <Skeleton className={cn(bar, 'max-w-full', w)} />
    </div>
  );
}

export function SkeletonButton({ w = 'w-28', className }: { w?: string; className?: string }) {
  return <Skeleton className={cn('h-8 shrink-0 rounded-lg', w, className)} />;
}

export function SkeletonBadge({ w = 'w-20' }: { w?: string }) {
  return <Skeleton className={cn('h-5 shrink-0 rounded-4xl', w)} />;
}

function Lines({
  count,
  size = 'sm',
  last = 'w-2/3',
}: {
  count: number;
  size?: keyof typeof lineSizes;
  last?: string;
}) {
  return (
    <div>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonLine key={i} size={size} w={i === count - 1 ? last : 'w-full'} />
      ))}
    </div>
  );
}

export function SkeletonPage({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-6', className)} aria-busy="true" aria-label="Betöltés…">
      {children}
    </div>
  );
}

export function SkeletonPageHeader({
  back = false,
  eyebrow = true,
  title = 'w-56',
  description = 'w-96',
  lines = 1,
  meta = 0,
  actions = 0,
}: {
  back?: boolean;
  eyebrow?: boolean;
  title?: string;
  description?: string | false;
  lines?: number;
  meta?: number;
  actions?: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      {back && <SkeletonLine size="sm" w="w-32" />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          {eyebrow && <SkeletonLine size="xs" w="w-20" />}
          <SkeletonLine size="2xl" w={title} />
          {description && (lines > 1 ? <Lines count={lines} /> : <SkeletonLine size="sm" w={description} />)}
          {meta > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {Array.from({ length: meta }, (_, i) => (
                <SkeletonBadge key={i} />
              ))}
            </div>
          )}
        </div>
        {actions > 0 && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {Array.from({ length: actions }, (_, i) => (
              <SkeletonButton key={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function SkeletonStatGrid({ count = 4, hint = false }: { count?: number; hint?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col rounded-xl bg-card p-4 shadow-card ring-1 ring-foreground/8">
          <div className="flex items-start justify-between gap-3">
            <SkeletonLine size="sm" w="w-20" />
            <Skeleton className="size-8 shrink-0 rounded-lg" />
          </div>
          <SkeletonLine size="2xl" w="w-14" className="mt-1" />
          {hint && <SkeletonLine size="xs" w="w-24" className="mt-1" />}
        </div>
      ))}
    </div>
  );
}

export function SkeletonSection({
  title = 'w-40',
  description = 'w-80',
  actions = false,
  children,
}: {
  title?: string;
  description?: string | false;
  actions?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-0.5">
          <SkeletonLine size="lg" w={title} />
          {description && <SkeletonLine size="sm" w={description} />}
        </div>
        {actions && <SkeletonButton />}
      </div>
      {children}
    </section>
  );
}

const columnWidths = ['w-36', 'w-24', 'w-20', 'w-28', 'w-16', 'w-24', 'w-20', 'w-24', 'w-16'];

export function SkeletonTable({
  columns = 5,
  rows = 5,
  tall = false,
  mono = false,
  footer = false,
}: {
  columns?: number | string[];
  rows?: number;
  tall?: boolean | number;
  mono?: boolean | number;
  footer?: boolean;
}) {
  const widths = typeof columns === 'number' ? columnWidths.slice(0, columns) : columns;
  const tallIndex = tall === true ? 0 : tall === false ? -1 : tall;
  const monoIndex = mono === true ? 0 : mono === false ? -1 : mono;
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-card ring-1 ring-foreground/8">
      <div className="flex h-9 items-center gap-6 border-b bg-muted/40 px-3">
        {widths.map((w, i) => (
          <Skeleton key={i} className={cn('h-2.5 shrink-0', w)} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className={cn('flex items-center gap-6 px-3 py-2.5', r < rows - 1 && 'border-b')}>
          {widths.map((w, i) =>
            i === tallIndex ? (
              <div key={i} className={cn('flex shrink-0 flex-col', w)}>
                <SkeletonLine size="sm" w="w-full" />
                <SkeletonLine size="xs" w="w-2/3" />
              </div>
            ) : (
              <SkeletonLine key={i} size={i === monoIndex ? 'chip' : 'sm'} w={w} className="shrink-0" />
            ),
          )}
        </div>
      ))}
      {footer && (
        <div className="flex items-center gap-2 border-t bg-muted/30 px-3 py-2">
          <SkeletonLine size="sm" w="w-24" />
        </div>
      )}
    </div>
  );
}

export function SkeletonCard({
  title = 'w-40',
  description = 'w-80',
  lines = 1,
  children,
  className,
}: {
  title?: string | false;
  description?: string | false;
  lines?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 shadow-card ring-1 ring-foreground/8',
        className,
      )}
    >
      {(title || description) && (
        <div className="grid gap-1 px-4">
          {title && <SkeletonLine size="title" w={title} />}
          {description && (lines > 1 ? <Lines count={lines} /> : <SkeletonLine size="sm" w={description} />)}
        </div>
      )}
      <div className="px-4">{children}</div>
    </div>
  );
}

export function SkeletonField({
  kind = 'input',
  described = false,
}: {
  kind?: 'input' | 'textarea' | 'checkbox';
  described?: boolean | number;
}) {
  if (kind === 'checkbox') {
    return (
      <div className="flex items-start gap-2">
        <Skeleton className="mt-0.5 size-4 shrink-0 rounded-[4px]" />
        <div className="flex flex-1 flex-col gap-0.5">
          <SkeletonLine size="sm" w="w-48" />
          {described && <SkeletonLine size="sm" w="w-72" />}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <SkeletonLine size="sm" w="w-24" />
      <Skeleton className={cn('w-full rounded-lg', kind === 'textarea' ? 'h-16' : 'h-8')} />
      {described && <Lines count={described === true ? 1 : described} last="w-3/5" />}
    </div>
  );
}

export function SkeletonForm({
  children,
  submit = 'w-32',
  className,
}: {
  children: React.ReactNode;
  submit?: string | false;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-5', className)}>
      {children}
      {submit && (
        <div>
          <SkeletonButton w={submit} />
        </div>
      )}
    </div>
  );
}

export function SkeletonFieldRow({ children, cols = 'sm:grid-cols-2' }: { children: React.ReactNode; cols?: string }) {
  return <div className={cn('grid grid-cols-1 gap-5', cols)}>{children}</div>;
}

export function SkeletonInlineForm({ submit = 'w-32' }: { submit?: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <SkeletonField />
      </div>
      <SkeletonButton w={submit} />
    </div>
  );
}

export function SkeletonCallout({
  lines = 2,
  title = true,
  className,
}: {
  lines?: number;
  title?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-3 rounded-xl border-l-4 border-foreground/10 bg-muted/40 px-4 py-3', className)}>
      <Skeleton className="mt-0.5 size-4 shrink-0 rounded" />
      <div className="min-w-0 flex-1 space-y-0.5">
        {title && <SkeletonLine size="sm" w="w-48" />}
        <Lines count={lines} />
      </div>
    </div>
  );
}

export function SkeletonSplit({
  children,
  aside,
  asideLines = 4,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
  asideLines?: number;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      {children}
      {aside ?? <SkeletonCallout lines={asideLines} className="h-fit" />}
    </div>
  );
}

const chipWidths = ['w-16', 'w-24', 'w-28', 'w-20', 'w-24', 'w-36', 'w-40'];

export function SkeletonChips({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={cn('h-8 rounded-full', chipWidths[i % chipWidths.length])} />
      ))}
    </div>
  );
}

export function SkeletonSearchBar({ select = false, button = 'w-17' }: { select?: boolean | string; button?: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-2 shadow-card ring-1 ring-foreground/8 sm:flex-row sm:items-center">
      <div className="flex-1">
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
      {select && <Skeleton className={cn('h-8 rounded-lg', select === true ? 'sm:w-44' : select)} />}
      <SkeletonButton w={button} />
    </div>
  );
}

export function SkeletonFilterBar({ fields = 4 }: { fields?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl bg-card p-3 shadow-card ring-1 ring-foreground/8 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_10rem_10rem_auto]">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <SkeletonLine size="label" w="w-24" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      ))}
      <div className="flex items-end gap-2">
        <SkeletonButton w="w-20" />
        <SkeletonButton w="w-16" />
      </div>
    </div>
  );
}

function CompanyTile() {
  return (
    <div className="flex h-full flex-col gap-4 rounded-xl bg-card p-5 shadow-card ring-1 ring-foreground/8">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-1">
          <SkeletonLine size="base" w="w-40" />
          <SkeletonLine size="sm" w="w-full" />
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
        <div className="flex items-center gap-2">
          <SkeletonBadge w="w-24" />
          <SkeletonLine size="sm" w="w-10" />
        </div>
        <Skeleton className="size-4 rounded" />
      </div>
    </div>
  );
}

function SoftwareTile() {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-card ring-1 ring-foreground/8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <SkeletonLine size="base" w="w-32" />
          <SkeletonLine size="sm" w="w-24" />
        </div>
        <Skeleton className="size-8 shrink-0 rounded-lg" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <SkeletonBadge w="w-24" />
        <SkeletonLine size="xs" w="w-20" />
      </div>
    </div>
  );
}

function PoolTile() {
  return (
    <div className="flex h-full flex-col gap-4 rounded-xl bg-card p-5 shadow-card ring-1 ring-foreground/8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <SkeletonLine size="base" w="w-32" />
          <SkeletonLine size="xs" w="w-40" />
        </div>
        <SkeletonBadge w="w-16" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
      <div className="flex items-center justify-between">
        <SkeletonLine size="sm" w="w-32" />
        <SkeletonLine size="sm" w="w-16" />
      </div>
    </div>
  );
}

function ProductTile() {
  return (
    <div className="flex h-full flex-col gap-4 rounded-xl bg-card p-5 shadow-card ring-1 ring-foreground/8">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="size-10 shrink-0 rounded-lg" />
        <SkeletonLine size="xs" w="w-20" />
      </div>
      <div className="space-y-1">
        <SkeletonLine size="base" w="w-28" />
        <Lines count={2} />
      </div>
      <div className="mt-auto flex items-center justify-between border-t pt-4">
        <SkeletonLine size="sm" w="w-32" />
        <SkeletonLine size="sm" w="w-20" />
      </div>
    </div>
  );
}

const planItemWidths = ['w-28', 'w-32', 'w-52'];

function PlanTile() {
  return (
    <div className="flex h-full flex-col gap-4 rounded-xl bg-card p-5 shadow-card ring-1 ring-foreground/8">
      <div className="space-y-1">
        <SkeletonLine size="base" w="w-44" />
        <SkeletonLine size="sm" w="w-28" />
      </div>
      <SkeletonLine size="3xl" w="w-36" />
      <div className="flex flex-col gap-1.5">
        {planItemWidths.map(w => (
          <div key={w} className="flex items-start gap-2">
            <Skeleton className="mt-0.5 size-4 shrink-0 rounded" />
            <SkeletonLine size="sm" w={w} />
          </div>
        ))}
      </div>
      <SkeletonButton w="w-full" className="mt-auto" />
    </div>
  );
}

const tiles = { company: CompanyTile, software: SoftwareTile, pool: PoolTile, product: ProductTile, plan: PlanTile };

export function SkeletonTileGrid({
  tile,
  count = 2,
  className = 'sm:grid-cols-2 xl:grid-cols-3',
}: {
  tile: keyof typeof tiles;
  count?: number;
  className?: string;
}) {
  const Tile = tiles[tile];
  return (
    <ul className={cn('grid grid-cols-1 gap-4', className)}>
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <Tile />
        </li>
      ))}
    </ul>
  );
}

export function SkeletonCapacityCard() {
  return (
    <div className="rounded-xl bg-card p-4 shadow-card ring-1 ring-foreground/8">
      <div className="mb-2 flex items-center justify-between">
        <SkeletonLine size="sm" w="w-28" />
        <SkeletonLine size="sm" w="w-20" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

export function SkeletonDetailList({ items = 4 }: { items?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: items }, (_, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <SkeletonLine size="xs" w="w-20" />
          <SkeletonLine size="sm" w={i % 2 ? 'w-48' : 'w-32'} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTimeline({ items = 5 }: { items?: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: items }, (_, i) => (
        <div
          key={i}
          className="relative flex gap-3 pb-5 before:absolute before:top-7 before:bottom-0 before:left-3.5 before:w-px before:bg-border last:pb-0 last:before:hidden"
        >
          <Skeleton className="size-7 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <SkeletonLine size="xs" w="w-32" />
            <SkeletonLine size="sm" w={i % 2 ? 'w-3/4' : 'w-1/2'} />
            <SkeletonLine size="xs" w="w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
