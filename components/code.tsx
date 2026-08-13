import { cn } from '@/lib/utils';

export function Mono({ className, ...props }: React.ComponentProps<'code'>) {
  return (
    <code
      className={cn(
        'rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] wrap-anywhere text-foreground',
        className,
      )}
      {...props}
    />
  );
}
