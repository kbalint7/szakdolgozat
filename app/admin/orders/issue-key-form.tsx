'use client';

import { useActionState } from 'react';

import { SelectField } from '@/components/forms/fields';
import { FormMessage } from '@/components/forms/form-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { SecretReveal } from '@/components/secret-reveal';
import type { ActionState } from '@/lib/action-state';

import { issueKeyAction } from './actions';

const initialState: ActionState<{ licenseKey: string }> = { status: 'idle' };

export function IssueKeyForm({ plans }: { plans: { id: string; label: string }[] }) {
  const [state, formAction] = useActionState(issueKeyAction, initialState);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <SelectField
            name="planId"
            label="Csomag"
            options={plans.map(plan => ({ value: plan.id, label: plan.label }))}
            placeholder="Válassz csomagot…"
            defaultValue={state.values?.planId ?? ''}
            errors={state.fieldErrors?.planId}
          />
        </div>
        <SubmitButton>Kulcs kiadása</SubmitButton>
      </form>
      {state.status === 'error' && <FormMessage status="error" message={state.message} />}
      {state.status === 'success' && state.data && (
        <SecretReveal
          label="Új licenckulcs"
          value={state.data.licenseKey}
          note="Add át az ügyfélnek. Most látod utoljára: csak a lenyomatát tároljuk."
        />
      )}
    </div>
  );
}
