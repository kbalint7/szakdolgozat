'use client';

import { useActionState } from 'react';

import { FormMessage } from '@/components/forms/form-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { TextField } from '@/components/forms/text-field';
import { useActionFeedback } from '@/components/forms/use-action-feedback';
import { FieldGroup } from '@/components/ui/field';
import { initialActionState } from '@/lib/action-state';

import { updateProfileAction } from './actions';

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, formAction] = useActionState(updateProfileAction, initialActionState);
  useActionFeedback(state);

  return (
    <form action={formAction} className="max-w-xl">
      <FieldGroup>
        {state.status === 'error' && <FormMessage status="error" message={state.message} />}
        <TextField
          name="name"
          label="Név"
          autoComplete="name"
          defaultValue={state.values?.name ?? name}
          errors={state.fieldErrors?.name}
          required
        />
        <TextField name="email" label="E-mail-cím" value={email} disabled readOnly />
        <div>
          <SubmitButton>Mentés</SubmitButton>
        </div>
      </FieldGroup>
    </form>
  );
}
