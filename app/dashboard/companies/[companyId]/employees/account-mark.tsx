import { cn } from 'cn';

export const linkedDot = 'size-2 shrink-0 rounded-full bg-success';
export const unlinkedDot = 'size-2 shrink-0 rounded-full ring-1 ring-muted-foreground/50 ring-inset';

export function AccountMark({ title, className }: { title?: string; className?: string }) {
  return (
    <span
      title={title}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 text-[13px] font-normal whitespace-nowrap text-muted-foreground',
        className,
      )}
    >
      <span aria-hidden className={linkedDot} />
      fiók
    </span>
  );
}
