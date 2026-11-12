'use client';

import { MoreHorizontalIcon } from 'lucide-react';
import { useActionState, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { BusyLabel } from '@/components/forms/busy-label';
import { SubmitButton } from '@/components/forms/submit-button';
import { SecretReveal } from '@/components/secret-reveal';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import type { ActionState } from '@/lib/action-state';

import { inviteAction, regenerateLinkAction, revokeInvitationAction, type InvitationLink } from './actions';

const initialState: ActionState<InvitationLink> = { status: 'idle' };

export function InviteForm({ companyId, canInviteAdmins }: { companyId: string; canInviteAdmins: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(async (prev: ActionState<InvitationLink>, formData: FormData) => {
    const result = await inviteAction(companyId, prev, formData);
    if (result.status === 'success') formRef.current?.reset();
    return result;
  }, initialState);
  const failed = state.status === 'error';
  const fieldErrors = failed ? [...(state.fieldErrors?.email ?? []), ...(state.fieldErrors?.role ?? [])] : [];
  const errors = fieldErrors.length > 0 ? fieldErrors : failed && state.message ? [state.message] : [];

  return (
    <div className="flex flex-col gap-3 border-b border-border/70 px-5 py-4">
      <form ref={formRef} action={formAction} className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            name="email"
            type="email"
            aria-label="E-mail-cím"
            aria-describedby="invite-help"
            aria-invalid={Boolean(state.fieldErrors?.email?.length) || undefined}
            placeholder="E-mail-cím"
            autoComplete="off"
            defaultValue={failed ? state.values?.email : undefined}
            className="sm:flex-1"
            required
          />
          <NativeSelect
            name="role"
            aria-label="Szerepkör"
            defaultValue={state.values?.role ?? 'member'}
            className="w-full sm:w-44"
          >
            <NativeSelectOption value="member">Tag</NativeSelectOption>
            {canInviteAdmins && <NativeSelectOption value="admin">Adminisztrátor</NativeSelectOption>}
          </NativeSelect>
          <SubmitButton>Meghívó létrehozása</SubmitButton>
        </div>
        {errors.length > 0 && <FieldError errors={errors.map(message => ({ message }))} />}
        <p id="invite-help" className="text-[13px] text-pretty text-muted-foreground">
          Ha ez a cím egy munkavállalóé, a meghívott fiókját automatikusan összekapcsoljuk vele.
        </p>
      </form>
      {state.status === 'success' && state.data && (
        <SecretReveal
          label={`Meghívólink: ${state.data.email}`}
          value={state.data.link}
          note="Küldd el a meghívottnak. A link 7 napig érvényes, és ha elveszne, a meghívó sorában kérhetsz újat."
        />
      )}
    </div>
  );
}

export function InvitationActions({
  companyId,
  invitation,
}: {
  companyId: string;
  invitation: { id: string; email: string };
}) {
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [showingLink, setShowingLink] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function newLink() {
    startTransition(async () => {
      const result = await regenerateLinkAction(companyId, invitation.id);
      if (result.status === 'error') toast.error(result.message);
      else if (result.data) {
        setLink(result.data.link);
        setShowingLink(true);
      }
    });
  }

  function revoke() {
    startTransition(async () => {
      const result = await revokeInvitationAction(companyId, invitation.id);
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
              aria-label={`Műveletek: ${invitation.email}`}
              disabled={pending}
            />
          }
        >
          {pending && !confirming ? <Spinner /> : <MoreHorizontalIcon />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={newLink}>Új link kérése</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirming(true)}>
            Meghívó visszavonása
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showingLink} onOpenChange={setShowingLink}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Új meghívólink</DialogTitle>
            <DialogDescription>A korábbi link már nem működik. Az új 7 napig érvényes.</DialogDescription>
          </DialogHeader>
          {link && (
            <SecretReveal label={`Meghívólink: ${invitation.email}`} value={link} note="Küldd el a meghívottnak." />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Visszavonod a meghívót?</AlertDialogTitle>
            <AlertDialogDescription>
              A meghívó linkje többé nem működik. Címzett: {invitation.email}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Mégse</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={pending}
              focusableWhenDisabled
              aria-busy={pending || undefined}
              onClick={revoke}
            >
              <BusyLabel busy={pending}>Visszavonás</BusyLabel>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
