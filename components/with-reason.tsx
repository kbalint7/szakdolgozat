import { cn } from 'cn';

export function WithReason({
  children,
  reason,
  className,
}: {
  children: React.ReactNode;
  reason?: React.ReactNode;
  className?: string;
}) {
  if (!reason) return <span className={cn('block text-pretty', className)}>{children}</span>;
  return (
    <span className={cn('block overflow-hidden', className)}>
      <span className="-ml-[1em] flex flex-wrap">
        <span className="min-w-0 pl-[1em] text-pretty">{children}</span>
        <span className="whitespace-nowrap text-muted-foreground before:inline-block before:w-[1em] before:text-center before:content-['·']">
          {reason}
        </span>
      </span>
    </span>
  );
}
