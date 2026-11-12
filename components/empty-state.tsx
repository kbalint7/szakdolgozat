import { cn } from 'cn';

import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Empty
      className={cn(
        'max-w-[46rem] border border-dashed border-input bg-card/40',
        compact ? 'gap-3 px-5 py-6' : 'px-6 py-12',
        className,
      )}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-10 rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
          {icon}
        </EmptyMedia>
        <EmptyTitle className="text-[15px]">{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}
