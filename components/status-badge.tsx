import { cn } from 'cn';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

const dotTone: Record<StatusTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-info',
  neutral: 'bg-muted-foreground/50',
  primary: 'bg-primary',
};

const textTone: Record<StatusTone, string> = {
  success: '',
  warning: 'text-warning',
  danger: 'text-destructive',
  info: '',
  neutral: 'text-muted-foreground',
  primary: '',
};

export function StatusBadge({
  tone = 'neutral',
  dot = true,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<'span'>, 'color'> & { tone?: StatusTone; dot?: boolean | 'hidden' }) {
  return (
    <span className={cn('whitespace-nowrap', textTone[tone], className)} {...props}>
      {dot && (
        <span
          aria-hidden
          className={cn('mr-1.5 inline-block size-1.5 rounded-full align-middle', dot === true && dotTone[tone])}
        />
      )}
      {children}
    </span>
  );
}
