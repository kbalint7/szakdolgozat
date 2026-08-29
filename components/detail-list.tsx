import { cn } from '@/lib/utils';

export function DetailList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dl className={cn('grid gap-3', className)}>{children}</dl>;
}

export function Detail({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm break-words">{children}</dd>
    </div>
  );
}
