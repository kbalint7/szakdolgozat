'use client';

import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type SubmitButtonProps = React.ComponentProps<typeof Button> & { pending?: boolean };

export function SubmitButton({ children, pending, disabled, ...props }: SubmitButtonProps) {
  const status = useFormStatus();
  const isPending = pending ?? status.pending;
  return (
    <Button type="submit" disabled={disabled || isPending} aria-busy={isPending || undefined} {...props}>
      {isPending && <Spinner />}
      {children}
    </Button>
  );
}
