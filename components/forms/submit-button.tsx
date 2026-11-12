'use client';

import { cn } from 'cn';
import { useFormStatus } from 'react-dom';

import { BusyLabel } from '@/components/forms/busy-label';
import { Button } from '@/components/ui/button';

type SubmitButtonProps = React.ComponentProps<typeof Button> & { pending?: boolean };

export function SubmitButton({ children, pending, disabled, className, ...props }: SubmitButtonProps) {
  const status = useFormStatus();
  const isPending = pending ?? status.pending;
  return (
    <Button
      type="submit"
      disabled={disabled || isPending}
      focusableWhenDisabled={isPending}
      aria-busy={isPending || undefined}
      className={cn('max-sm:w-full', className)}
      {...props}
    >
      <BusyLabel busy={isPending}>{children}</BusyLabel>
    </Button>
  );
}
