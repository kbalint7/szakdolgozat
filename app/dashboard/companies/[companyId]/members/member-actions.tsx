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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
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
  const [pending, startTransition] = useTransition();

  const canPromote = canChangeRole && member.role === 'member';
  const canDemote = canChangeRole && member.role === 'admin';
  const hasOtherActions = canPromote || canDemote || canTransfer;

  if (!hasOtherActions && !canRemove) return null;

  function execute(run: () => Promise<ActionState>) {
    startTransition(async () => {
      const result = await run();
      setConfirm(null);
      if (result.status === 'error') toast.error(result.message);
      else if (result.message) toast.success(result.message);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label={`Műveletek: ${member.name}`} />}
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
              Visszaminősítés taggá
            </DropdownMenuItem>
          )}
          {canTransfer && (
            <DropdownMenuItem
              onClick={() =>
                setConfirm({
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
                  setConfirm({
                    title: 'Eltávolítod a tagot?',
                    description: `${member.name} elveszíti a hozzáférését a céghez. Ha munkavállalóhoz volt kapcsolva, a kapcsolat megszűnik: a helye megmarad, de a szoftvert nem tudja használni, amíg újra össze nem kapcsoljátok.`,
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

      <AlertDialog open={confirm !== null} onOpenChange={open => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Mégse</AlertDialogCancel>
            <Button variant="destructive" disabled={pending} onClick={() => confirm && execute(confirm.run)}>
              {pending && <Spinner />}
              {confirm?.confirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
