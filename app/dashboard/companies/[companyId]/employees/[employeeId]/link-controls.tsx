'use client';

import { useActionState } from 'react';

import { ActionButton } from '@/components/forms/action-button';
import { SelectField } from '@/components/forms/fields';
import { FormMessage } from '@/components/forms/form-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { useActionFeedback } from '@/components/forms/use-action-feedback';
import { initialActionState } from '@/lib/action-state';

import { linkEmployeeAction, unlinkEmployeeAction } from '../actions';

export function LinkControls({
  companyId,
  employeeId,
  linkedUser,
  candidates,
}: {
  companyId: string;
  employeeId: string;
  linkedUser: { name: string; email: string } | null;
  candidates: { membershipId: string; name: string; email: string }[];
}) {
  const [state, formAction] = useActionState(linkEmployeeAction.bind(null, companyId, employeeId), initialActionState);
  useActionFeedback(state);

  if (linkedUser) {
    return (
      <ActionButton
        variant="outline"
        size="sm"
        action={unlinkEmployeeAction.bind(null, companyId, employeeId)}
        confirm={{
          title: 'Megszünteted a kapcsolatot?',
          description: `${linkedUser.name} nem tudja használni a szoftvert, amíg újra össze nem kapcsoljátok. A munkavállaló helye megmarad.`,
          confirmLabel: 'Leválasztás',
          destructive: true,
        }}
      >
        Leválasztás a fiókról
      </ActionButton>
    );
  }

  if (candidates.length === 0) {
    return <p className="text-sm text-muted-foreground">Nincs olyan tag, aki még nincs munkavállalóhoz kapcsolva.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.status === 'error' && <FormMessage status="error" message={state.message} />}
      <SelectField
        name="membershipId"
        label="Tag kapcsolása"
        options={candidates.map(member => ({ value: member.membershipId, label: `${member.name} (${member.email})` }))}
        placeholder="Válassz tagot…"
        defaultValue=""
        errors={state.fieldErrors?.membershipId}
      />
      <div>
        <SubmitButton size="sm">Kapcsolás</SubmitButton>
      </div>
    </form>
  );
}
