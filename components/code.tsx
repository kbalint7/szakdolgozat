import { cn } from 'cn';

export function Mono({ className, ...props }: React.ComponentProps<'code'>) {
  return (
    <code
      className={cn(
        'rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] wrap-anywhere text-foreground/85',
        className,
      )}
      {...props}
    />
  );
}

export function Ident({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={cn('nums whitespace-nowrap text-muted-foreground', className)} {...props} />;
}
