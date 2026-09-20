'use client';

import { useActionState } from 'react';

import { FormMessage } from '@/components/forms/form-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { TextField } from '@/components/forms/text-field';
import { SecretReveal } from '@/components/secret-reveal';
import type { ActionState } from '@/lib/action-state';

import { createTokenAction } from './actions';

const initialState: ActionState<{ token: string }> = { status: 'idle' };

export function CreateTokenForm() {
  const [state, formAction] = useActionState(createTokenAction, initialState);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <TextField
            name="name"
            label="Név"
            placeholder="pl. Munkahelyi laptop"
            defaultValue={state.status === 'error' ? state.values?.name : undefined}
            errors={state.fieldErrors?.name}
            required
          />
        </div>
        <SubmitButton>Token létrehozása</SubmitButton>
      </form>
      {state.status === 'error' && !state.fieldErrors && <FormMessage status="error" message={state.message} />}
      {state.status === 'success' && state.data && (
        <SecretReveal
          label="Új kliens token"
          value={state.data.token}
          note="Add meg a szoftver beállításaiban. Később nem tudjuk újra megmutatni."
        />
      )}
    </div>
  );
}
