import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from 'cn';
import Link from 'next/link';
import { Fragment } from 'react';

export type Crumb = { href: string; label: string };

export function PageHeader({
  title,
  description,
  trail,
  trailMobileOnly = false,
  meta,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  trail?: Crumb[];
  trailMobileOnly?: boolean;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {trail && trail.length > 0 && (
        <nav aria-label="Navigációs útvonal" className={cn(trailMobileOnly && 'md:hidden')}>
          <ol className="flex min-w-0 flex-wrap items-center gap-x-1 text-[13px] text-muted-foreground">
            {trail.length === 1 && <ChevronLeftIcon aria-hidden className="-ml-0.5 size-3.5 shrink-0 opacity-60" />}
            {trail.map((crumb, index) => (
              <Fragment key={crumb.href}>
                {index > 0 && <ChevronRightIcon aria-hidden className="size-3.5 shrink-0 opacity-60" />}
                <li className="min-w-0">
                  <Link
                    href={crumb.href}
                    className="block truncate rounded-sm transition-colors hover:text-foreground focus-visible:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                </li>
              </Fragment>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h1 className="text-[1.625rem] leading-8 font-semibold tracking-tight text-balance">{title}</h1>
          {description && (
            <p className="max-w-[68ch] text-sm/relaxed text-pretty text-muted-foreground">{description}</p>
          )}
          {meta && <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-sm">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
