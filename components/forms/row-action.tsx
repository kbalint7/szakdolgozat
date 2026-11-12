'use client';

import { cn } from 'cn';

import { ActionButton } from '@/components/forms/action-button';

export function RowAction({
  destructive = false,
  className,
  ...props
}: Omit<React.ComponentProps<typeof ActionButton>, 'variant' | 'size'> & { destructive?: boolean }) {
  return (
    <ActionButton
      variant="ghost"
      size="sm"
      className={cn(
        '-my-1 -mr-2',
        'text-muted-foreground',
        destructive
          ? 'hover:bg-destructive/10 hover:text-destructive focus-visible:border-destructive/40 focus-visible:text-destructive focus-visible:ring-destructive/20 dark:hover:bg-destructive/15 dark:focus-visible:ring-destructive/40'
          : 'hover:text-foreground',
        className,
      )}
      {...props}
    />
  );
}
