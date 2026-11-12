'use client';

import { useActionState } from 'react';

import { FormMessage } from '@/components/forms/form-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { TextField } from '@/components/forms/text-field';
import { SecretReveal } from '@/components/secret-reveal';
import { FieldGroup } from '@/components/ui/field';
import type { ActionState } from '@/lib/action-state';

import { createTokenAction } from './actions';

const initialState: ActionState<{ token: string }> = { status: 'idle' };

export function CreateTokenForm() {
  const [state, formAction] = useActionState(createTokenAction, initialState);

  return (
    <div className="flex flex-col gap-5">
      <form action={formAction}>
        <FieldGroup>
          {state.status === 'error' && !state.fieldErrors && <FormMessage status="error" message={state.message} />}
          <TextField
            name="name"
            label="Név"
            placeholder="pl. Munkahelyi laptop"
            defaultValue={state.status === 'error' ? state.values?.name : undefined}
            errors={state.fieldErrors?.name}
            required
          />
          <div>
            <SubmitButton>Token létrehozása</SubmitButton>
          </div>
        </FieldGroup>
      </form>
      {state.status === 'success' && state.data && <SecretReveal label="Új klienstoken" value={state.data.token} />}
    </div>
  );
}
