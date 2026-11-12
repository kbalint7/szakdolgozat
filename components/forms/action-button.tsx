'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BusyLabel } from '@/components/forms/busy-label';
import { Button } from '@/components/ui/button';
import type { ActionState } from '@/lib/action-state';

type ConfirmOptions = {
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
};

type ActionButtonProps = Omit<React.ComponentProps<typeof Button>, 'onClick' | 'action'> & {
  action: () => Promise<ActionState | void>;
  confirm?: ConfirmOptions;
};

export function ActionButton({ action, confirm, children, disabled, ...props }: ActionButtonProps) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function run() {
    startTransition(async () => {
      const result = await action();
      setOpen(false);
      if (!result) return;
      if (result.status === 'error') toast.error(result.message ?? 'Váratlan hiba történt. Próbáld újra.');
      else if (result.status === 'success' && result.message) toast.success(result.message);
    });
  }

  const button = (
    <Button
      {...props}
      disabled={disabled || pending}
      focusableWhenDisabled={pending}
      aria-busy={pending || undefined}
      onClick={confirm ? () => setOpen(true) : run}
    >
      {confirm ? children : <BusyLabel busy={pending}>{children}</BusyLabel>}
    </Button>
  );

  if (!confirm) return button;

  return (
    <>
      {button}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
            <AlertDialogDescription render={<div />}>{confirm.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Mégse</AlertDialogCancel>
            <Button
              variant={confirm.destructive ? 'destructive' : 'default'}
              disabled={pending}
              focusableWhenDisabled
              aria-busy={pending || undefined}
              onClick={run}
            >
              <BusyLabel busy={pending}>{confirm.confirmLabel ?? 'Megerősítés'}</BusyLabel>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
