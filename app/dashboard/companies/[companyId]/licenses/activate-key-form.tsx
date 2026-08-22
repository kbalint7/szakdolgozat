'use client';

import { useActionState, useRef } from 'react';

import { FormMessage } from '@/components/forms/form-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { TextField } from '@/components/forms/text-field';
import { useActionFeedback } from '@/components/forms/use-action-feedback';
import { initialActionState } from '@/lib/action-state';

import { activateKeyAction } from './actions';

export function ActivateKeyForm({ companyId }: { companyId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(activateKeyAction.bind(null, companyId), initialActionState);
  useActionFeedback(state, () => formRef.current?.reset());

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      {state.status === 'error' && <FormMessage status="error" message={state.message} />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <TextField
            name="key"
            label="Licenckulcs"
            placeholder="LK-XXXXX-XXXXX-XXXXX-XXXXX"
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
            defaultValue={state.status === 'error' ? state.values?.key : undefined}
            errors={state.fieldErrors?.key}
            required
          />
        </div>
        <SubmitButton>Aktiválás</SubmitButton>
      </div>
    </form>
  );
}
