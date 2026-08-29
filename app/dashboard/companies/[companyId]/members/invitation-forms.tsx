'use client';

import { LinkIcon } from 'lucide-react';
import { useActionState, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { SelectField } from '@/components/forms/fields';
import { FormMessage } from '@/components/forms/form-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { TextField } from '@/components/forms/text-field';
import { SecretReveal } from '@/components/secret-reveal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import type { ActionState } from '@/lib/action-state';

import { inviteAction, regenerateLinkAction, type InvitationLink } from './actions';

const initialState: ActionState<InvitationLink> = { status: 'idle' };

export function InviteForm({ companyId, canInviteAdmins }: { companyId: string; canInviteAdmins: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(async (prev: ActionState<InvitationLink>, formData: FormData) => {
    const result = await inviteAction(companyId, prev, formData);
    if (result.status === 'success') formRef.current?.reset();
    return result;
  }, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <div className="flex flex-col gap-4">
      <form ref={formRef} action={formAction}>
        <FieldGroup>
          {state.status === 'error' && <FormMessage status="error" message={state.message} />}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_12rem]">
            <TextField
              name="email"
              label="E-mail-cím"
              type="email"
              placeholder="kolleg@ceg.hu"
              defaultValue={state.status === 'error' ? state.values?.email : undefined}
              errors={errors.email}
              required
            />
            <SelectField
              name="role"
              label="Szerepkör"
              options={[
                { value: 'member', label: 'Tag' },
                ...(canInviteAdmins ? [{ value: 'admin', label: 'Adminisztrátor' }] : []),
              ]}
              defaultValue={state.values?.role ?? 'member'}
              errors={errors.role}
            />
          </div>
          <div>
            <SubmitButton>Meghívó létrehozása</SubmitButton>
          </div>
        </FieldGroup>
      </form>
      {state.status === 'success' && state.data && (
        <SecretReveal
          label={`Meghívólink: ${state.data.email}`}
          value={state.data.link}
          note="A link 7 napig érvényes és egyszer használható. Ha elveszik, később újat kérhetsz."
        />
      )}
    </div>
  );
}

export function RegenerateLinkButton({ companyId, invitationId }: { companyId: string; invitationId: string }) {
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);

  function run() {
    startTransition(async () => {
      const result = await regenerateLinkAction(companyId, invitationId);
      if (result.status === 'error') toast.error(result.message);
      else if (result.data) setLink(result.data.link);
    });
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={run} disabled={pending}>
        {pending ? <Spinner /> : <LinkIcon />} Új link
      </Button>
      <Dialog open={link !== null} onOpenChange={open => !open && setLink(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Új meghívólink</DialogTitle>
            <DialogDescription>A korábbi link érvénytelenné vált. Az új link 7 napig érvényes.</DialogDescription>
          </DialogHeader>
          {link && <SecretReveal label="Meghívólink" value={link} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
