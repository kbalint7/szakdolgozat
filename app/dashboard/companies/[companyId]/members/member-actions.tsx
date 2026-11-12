'use client';

import { MoreHorizontalIcon } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ActionState } from '@/lib/action-state';

import { removeMemberAction, setMemberRoleAction, transferOwnershipAction } from '../../actions';

type Pending = { title: string; description: string; confirmLabel: string; run: () => Promise<ActionState> } | null;

export function MemberActions({
  companyId,
  member,
  canChangeRole,
  canTransfer,
  canRemove,
}: {
  companyId: string;
  member: { membershipId: string; name: string; role: 'owner' | 'admin' | 'member' };
  canChangeRole: boolean;
  canTransfer: boolean;
  canRemove: boolean;
}) {
  const [confirm, setConfirm] = useState<Pending>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function ask(question: NonNullable<Pending>) {
    setConfirm(question);
    setConfirming(true);
  }

  const canPromote = canChangeRole && member.role === 'member';
  const canDemote = canChangeRole && member.role === 'admin';
  const hasOtherActions = canPromote || canDemote || canTransfer;

  if (!hasOtherActions && !canRemove) return null;

  function execute(run: () => Promise<ActionState>) {
    startTransition(async () => {
      const result = await run();
      setConfirming(false);
      if (result.status === 'error') toast.error(result.message);
      else if (result.message) toast.success(result.message);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="-my-1 -mr-1.5 text-muted-foreground"
              aria-label={`Műveletek: ${member.name}`}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {canPromote && (
            <DropdownMenuItem
              onClick={() => execute(() => setMemberRoleAction(companyId, member.membershipId, 'admin'))}
            >
              Előléptetés adminisztrátorrá
            </DropdownMenuItem>
          )}
          {canDemote && (
            <DropdownMenuItem
              onClick={() => execute(() => setMemberRoleAction(companyId, member.membershipId, 'member'))}
            >
              Lefokozás taggá
            </DropdownMenuItem>
          )}
          {canTransfer && (
            <DropdownMenuItem
              onClick={() =>
                ask({
                  title: 'Átadod a tulajdonjogot?',
                  description: `${member.name} lesz a cég tulajdonosa, te pedig adminisztrátor leszel. Ezt csak az új tulajdonos tudja visszacsinálni.`,
                  confirmLabel: 'Tulajdonjog átadása',
                  run: () => transferOwnershipAction(companyId, member.membershipId),
                })
              }
            >
              Tulajdonjog átadása
            </DropdownMenuItem>
          )}
          {canRemove && (
            <>
              {hasOtherActions && <DropdownMenuSeparator />}
              <DropdownMenuItem
                variant="destructive"
                onClick={() =>
                  ask({
                    title: 'Eltávolítod a tagot?',
                    description: `${member.name} nem tud többé belépni a cég felületére. Ha munkavállaló is, a helye megmarad. A szoftvert viszont nem tudja használni, amíg újra össze nem kapcsolod egy fiókkal.`,
                    confirmLabel: 'Eltávolítás',
                    run: () => removeMemberAction(companyId, member.membershipId),
                  })
                }
              >
                Eltávolítás a cégből
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Mégse</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={pending}
              focusableWhenDisabled
              aria-busy={pending || undefined}
              onClick={() => confirm && execute(confirm.run)}
            >
              <BusyLabel busy={pending}>{confirm?.confirmLabel}</BusyLabel>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
