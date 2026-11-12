import { cn } from 'cn';
import { ChevronRightIcon } from 'lucide-react';

export function DetailList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dl className={cn('grid gap-x-8 gap-y-3.5', className)}>{children}</dl>;
}

export function Detail({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-0.5', className)}>
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="text-sm wrap-break-word">{children}</dd>
    </div>
  );
}

export function DetailAction({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mt-4 -mb-1.5 border-t border-border/70 pt-3', className)}>{children}</div>;
}

export function FactList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-[9rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1', className)}>{children}</dl>
  );
}

export function Fact({ term, code = false, children }: { term: string; code?: boolean; children: React.ReactNode }) {
  return (
    <>
      <dt className={cn('text-muted-foreground', code && 'font-mono text-xs wrap-anywhere')}>{term}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

export function TechValue({ className, ...props }: React.ComponentProps<'code'>) {
  return <code className={cn('font-mono text-xs wrap-anywhere text-muted-foreground', className)} {...props} />;
}

export function TechnicalDetails({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <details className={cn('group/tech', className)}>
      <summary className="-ml-0.5 inline-flex cursor-pointer list-none items-center gap-1 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon aria-hidden className="size-3.5 transition-transform group-open/tech:rotate-90" />
        Technikai részletek
      </summary>
      <div className="mt-2 flex flex-col gap-3">{children}</div>
    </details>
  );
}
