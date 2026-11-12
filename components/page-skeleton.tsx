import { cn } from 'cn';

import { TableCard } from '@/components/table-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldContent, FieldDescription, FieldGroup } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const textBar: React.CSSProperties = {
  backgroundImage:
    'radial-gradient(closest-side, var(--muted) 96%, transparent), radial-gradient(closest-side, var(--muted) 96%, transparent), linear-gradient(var(--muted), var(--muted))',
  backgroundSize: '0.8em 0.8em, 0.8em 0.8em, calc(100% - 0.8em) 0.8em',
  backgroundPosition: '0 50%, 100% 50%, 50% 50%',
  backgroundRepeat: 'no-repeat',
  boxDecorationBreak: 'clone',
  WebkitBoxDecorationBreak: 'clone',
};

export function SkeletonText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      data-slot="skeleton"
      aria-hidden
      className={cn('animate-pulse text-transparent select-none', className)}
      style={textBar}
    >
      {children}
    </span>
  );
}

const buttonSizes = {
  sm: 'h-7 text-[0.8rem]',
  default: 'h-8 text-sm',
  lg: 'h-9 text-sm',
};

export function SkeletonButton({
  children,
  size = 'default',
  className,
}: {
  children: React.ReactNode;
  size?: keyof typeof buttonSizes;
  className?: string;
}) {
  return (
    <span
      data-slot="skeleton"
      aria-hidden
      className={cn(
        'inline-flex shrink-0 animate-pulse items-center justify-center rounded-lg border border-transparent bg-muted px-2.5 font-medium whitespace-nowrap text-transparent select-none',
        buttonSizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SkeletonRowAction({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        '-my-1 -mr-2 inline-flex h-7 shrink-0 items-center border border-transparent px-2.5 text-[0.8rem] font-medium whitespace-nowrap',
        className,
      )}
    >
      <SkeletonText>{children}</SkeletonText>
    </span>
  );
}

export function SkeletonStatus({ children }: { children: React.ReactNode }) {
  return (
    <span className="whitespace-nowrap">
      <span className="mr-1.5 inline-block size-1.5 align-middle" />
      <SkeletonText>{children}</SkeletonText>
    </span>
  );
}

export function SkeletonInput({ textarea = false, className }: { textarea?: boolean; className?: string }) {
  return <Skeleton className={cn('w-full rounded-lg', textarea ? 'h-16' : 'h-8', className)} />;
}

export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="contents" aria-busy="true" aria-label="Betöltés…">
      {children}
    </div>
  );
}

export function SkeletonPageHeader({
  trail,
  trailMobileOnly = false,
  title,
  description,
  meta,
  actions,
}: {
  trail?: string;
  trailMobileOnly?: boolean;
  title: string;
  description?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {trail && (
        <div className={cn('truncate text-[13px]', trailMobileOnly && 'md:hidden')}>
          <SkeletonText>{trail}</SkeletonText>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="text-[1.625rem] leading-8 font-semibold tracking-tight text-balance">
            <SkeletonText>{title}</SkeletonText>
          </div>
          {description && (
            <p className="max-w-[68ch] text-sm/relaxed text-pretty">
              <SkeletonText>{description}</SkeletonText>
            </p>
          )}
          {meta && <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-sm">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function SkeletonSection({
  title,
  count = false,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  count?: boolean;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <div className="space-y-0.5">
        <div className={cn('flex items-center justify-between gap-3', actions && 'min-h-8')}>
          <div className="min-w-0 text-base font-semibold tracking-tight">
            <SkeletonText>{title}</SkeletonText>
            {count && <SkeletonText className="ml-2 font-normal">00</SkeletonText>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
        {description && (
          <p className="max-w-[68ch] text-sm text-pretty">
            <SkeletonText>{description}</SkeletonText>
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

export function SkeletonStatStrip({
  stats,
  linked = false,
}: {
  stats: [label: string, value: string][];
  linked?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-border shadow-card ring-1 ring-border sm:auto-cols-fr sm:grid-flow-col">
      {stats.map(([label, value]) => (
        <div
          key={label}
          className={cn(
            'flex items-center justify-between gap-4 bg-card px-5 py-3 sm:flex-col sm:items-start sm:justify-start sm:gap-0 sm:py-4',
            linked && 'max-sm:pr-10',
          )}
        >
          <div className="min-w-0 text-[13px] max-sm:text-sm">
            <SkeletonText>{label}</SkeletonText>
          </div>
          <div className="nums text-xl leading-7 font-semibold tracking-tight sm:mt-1 sm:text-2xl">
            <SkeletonText>{value}</SkeletonText>
          </div>
        </div>
      ))}
    </div>
  );
}

export type SkeletonColumn = {
  head?: string;
  label?: React.ReactNode;
  cell?: string;
  content?: React.ReactNode | ((row: number) => React.ReactNode);
};

export function SkeletonTable({
  columns,
  rows,
  header,
  table,
  footer,
}: {
  columns: SkeletonColumn[];
  rows: number;
  header?: string | false;
  table?: string;
  footer?: React.ReactNode;
}) {
  return (
    <TableCard footer={footer}>
      <Table className={table}>
        {header !== false && (
          <TableHeader className={header}>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index} className={column.head}>
                  {typeof column.label === 'string' ? <SkeletonText>{column.label}</SkeletonText> : column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        )}
        <TableBody>
          {Array.from({ length: rows }, (_, row) => (
            <TableRow key={row} className="relative hover:bg-transparent">
              {columns.map((column, index) => (
                <TableCell key={index} className={column.cell}>
                  {typeof column.content === 'function' ? column.content(row) : column.content}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}

export function SkeletonChevron() {
  return <span className="ml-auto block size-4" />;
}

export function SkeletonLoadMore() {
  return (
    <div className="mx-auto flex items-center gap-3">
      <SkeletonButton size="sm">Továbbiak betöltése</SkeletonButton>
      <SkeletonText>25 / 124</SkeletonText>
    </div>
  );
}

export function SkeletonMeta({ items, className }: { items: string[]; className?: string }) {
  return (
    <span className={cn('block overflow-hidden text-[13px] leading-[1.125rem]', className)}>
      <span className="-ml-[1em] flex flex-wrap">
        {items.map(item => (
          <span key={item} className="whitespace-nowrap before:inline-block before:w-[1em] before:content-['']">
            <SkeletonText>{item}</SkeletonText>
          </span>
        ))}
      </span>
    </span>
  );
}

export function SkeletonCard({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      {(title || description) && (
        <CardHeader>
          {title && (
            <CardTitle>
              <SkeletonText>{title}</SkeletonText>
            </CardTitle>
          )}
          {description && (
            <CardDescription>
              <SkeletonText>{description}</SkeletonText>
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Label({ children }: { children: string }) {
  return (
    <div className="w-fit text-sm leading-snug font-medium">
      <SkeletonText>{children}</SkeletonText>
    </div>
  );
}

export function SkeletonField({
  label,
  kind = 'input',
  description,
  control,
}: {
  label: string;
  kind?: 'input' | 'textarea' | 'checkbox';
  description?: string | string[];
  control?: string;
}) {
  const help = description && (
    <FieldDescription>
      {typeof description === 'string' ? (
        <SkeletonText>{description}</SkeletonText>
      ) : (
        <span className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          {description.map(item => (
            <span key={item}>
              <SkeletonText>{item}</SkeletonText>
            </span>
          ))}
        </span>
      )}
    </FieldDescription>
  );
  if (kind === 'checkbox') {
    return (
      <Field orientation="horizontal">
        <Skeleton className="mt-px size-4 shrink-0 rounded-[4px]" />
        <FieldContent>
          <Label>{label}</Label>
          {help}
        </FieldContent>
      </Field>
    );
  }
  return (
    <Field>
      <Label>{label}</Label>
      <SkeletonInput textarea={kind === 'textarea'} className={control} />
      {help}
    </Field>
  );
}

export function SkeletonForm({
  children,
  submit,
  submitClassName,
}: {
  children: React.ReactNode;
  submit: string;
  submitClassName?: string;
}) {
  return (
    <FieldGroup>
      {children}
      <div>
        <SkeletonButton className={cn('max-sm:w-full', submitClassName)}>{submit}</SkeletonButton>
      </div>
    </FieldGroup>
  );
}

export function SkeletonCallout({
  title,
  children,
  after,
}: {
  title: string;
  children: string;
  after?: React.ReactNode;
}) {
  return (
    <div className="max-w-[46rem] border-l-2 border-border py-0.5 pl-4 text-[13px] text-pretty">
      <div className="mb-1 font-medium">
        <SkeletonText>{title}</SkeletonText>
      </div>
      <div className="leading-relaxed">
        <SkeletonText>{children}</SkeletonText>
        {after}
      </div>
    </div>
  );
}

export function SkeletonFilterBar({
  search = 'sm:w-72',
  chips,
  children,
}: {
  search?: string;
  chips?: string[];
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SkeletonInput className={search} />
      {chips && (
        <div className="flex gap-1 max-md:-mx-4 max-md:overflow-hidden max-md:pr-12 max-md:pl-4 md:flex-wrap">
          {chips.map(chip =>
            chip === '|' ? (
              <span key={chip} className="mx-1.5 h-4 w-px shrink-0 self-center bg-border" />
            ) : (
              <span
                key={chip}
                className="inline-flex h-8 shrink-0 items-center rounded-full border border-transparent px-3 text-sm whitespace-nowrap"
              >
                <SkeletonText>{chip}</SkeletonText>
              </span>
            ),
          )}
        </div>
      )}
      {children}
    </div>
  );
}

const seatSizes = { default: { cell: 12, gap: 4 }, lg: { cell: 16, gap: 6 } };

export function SkeletonSeatMeter({
  seats = 20,
  size = 'default',
  className,
}: {
  seats?: number;
  size?: keyof typeof seatSizes;
  className?: string;
}) {
  const { cell, gap } = seatSizes[size];
  const width = seats * cell + (seats - 1) * gap;
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2', className)}>
      <Skeleton
        className="w-full min-w-0 rounded-[4px]"
        style={{ maxWidth: width, aspectRatio: `${width} / ${cell}` }}
      />
      <span className="text-[13px] whitespace-nowrap">
        <SkeletonText>20 / 20 hely</SkeletonText>
      </span>
    </div>
  );
}
