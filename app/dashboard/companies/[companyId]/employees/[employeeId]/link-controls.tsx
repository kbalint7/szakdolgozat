'use client';

import { useActionState } from 'react';

import { SelectField } from '@/components/forms/fields';
import { FormMessage } from '@/components/forms/form-message';
import { RowAction } from '@/components/forms/row-action';
import { SubmitButton } from '@/components/forms/submit-button';
import { useActionFeedback } from '@/components/forms/use-action-feedback';
import { initialActionState } from '@/lib/action-state';

import { linkEmployeeAction, unlinkEmployeeAction } from '../actions';

export function LinkControls({
  companyId,
  employeeId,
  linkedUser,
  candidates,
  hasSeat,
}: {
  companyId: string;
  employeeId: string;
  linkedUser: { name: string; email: string } | null;
  candidates: { membershipId: string; name: string; email: string }[];
  hasSeat: boolean;
}) {
  const [state, formAction] = useActionState(linkEmployeeAction.bind(null, companyId, employeeId), initialActionState);
  useActionFeedback(state);

  if (linkedUser) {
    return (
      <RowAction
        destructive
        className="mr-0 -ml-2.5"
        action={unlinkEmployeeAction.bind(null, companyId, employeeId)}
        confirm={{
          title: 'Leválasztod a fiókot?',
          description: hasSeat
            ? `${linkedUser.name} nem tudja használni a szoftvert, amíg újra össze nem kapcsolod. A munkavállaló helye megmarad.`
            : `${linkedUser.name} fiókja leválik a munkavállaló adatairól. Amíg újra össze nem kapcsolod, a munkavállaló akkor sem tudja használni a szoftvert, ha helyet kap.`,
          confirmLabel: 'Leválasztás',
          destructive: true,
        }}
      >
        Fiók leválasztása
      </RowAction>
    );
  }

  if (candidates.length === 0) {
    return (
      <p className="pb-1.5 text-[13px] text-muted-foreground">
        Minden tag össze van már kapcsolva valakivel. Hívd meg a munkavállalót a Tagok és meghívók oldalon.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 pt-1 pb-1.5">
      {state.status === 'error' && <FormMessage status="error" message={state.message} />}
      <SelectField
        name="membershipId"
        label="Összekapcsolás taggal"
        options={candidates.map(member => ({ value: member.membershipId, label: `${member.name} (${member.email})` }))}
        placeholder="Válassz tagot…"
        defaultValue=""
        errors={state.fieldErrors?.membershipId}
      />
      <div>
        <SubmitButton>Összekapcsolás</SubmitButton>
      </div>
    </form>
  );
}
