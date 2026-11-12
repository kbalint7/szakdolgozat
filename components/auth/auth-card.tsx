import { cn } from 'cn';

import { PinnedColumn } from '@/components/auth/pinned-column';
import { SkeletonText } from '@/components/page-skeleton';

const column = 'flex w-full max-w-sm flex-col gap-6';
const panel = 'rounded-xl bg-card p-6 shadow-card ring-1 ring-border';

export function AuthCard({
  title,
  description,
  children,
  footer,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <PinnedColumn className={cn(column, className)}>
      <div className="space-y-1.5">
        <h1 className="text-[1.625rem] leading-8 font-semibold tracking-tight text-balance">{title}</h1>
        {description && <p className="text-sm/relaxed text-pretty text-muted-foreground">{description}</p>}
      </div>
      <div className={panel}>{children}</div>
      {footer && <p className="text-sm text-muted-foreground">{footer}</p>}
    </PinnedColumn>
  );
}

export function AuthCardSkeleton({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: string;
}) {
  return (
    <div className={column} aria-busy="true" aria-label="Betöltés…">
      <div className="space-y-1.5">
        <div className="text-[1.625rem] leading-8 font-semibold tracking-tight text-balance">
          <SkeletonText>{title}</SkeletonText>
        </div>
        {description && (
          <p className="text-sm/relaxed text-pretty">
            <SkeletonText>{description}</SkeletonText>
          </p>
        )}
      </div>
      <div className={panel}>{children}</div>
      {footer && (
        <p className="text-sm">
          <SkeletonText>{footer}</SkeletonText>
        </p>
      )}
    </div>
  );
}
