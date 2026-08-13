import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

const variantFor: Record<StatusTone, React.ComponentProps<typeof Badge>['variant']> = {
  success: 'success',
  warning: 'warning',
  danger: 'destructive',
  info: 'info',
  neutral: 'secondary',
  primary: 'default',
};

export function StatusBadge({
  tone = 'neutral',
  dot = true,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Badge>, 'variant'> & { tone?: StatusTone; dot?: boolean }) {
  return (
    <Badge variant={variantFor[tone]} className={cn('gap-1.5', className)} {...props}>
      {dot && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current opacity-80" />}
      {children}
    </Badge>
  );
}
