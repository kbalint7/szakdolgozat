'use client';

import { useActionState, useRef } from 'react';

import { FormMessage } from '@/components/forms/form-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { TextField } from '@/components/forms/text-field';
import { useActionFeedback } from '@/components/forms/use-action-feedback';
import { FieldGroup } from '@/components/ui/field';
import { initialActionState } from '@/lib/action-state';

import { activateKeyAction } from './actions';

export function ActivateKeyForm({ companyId }: { companyId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(activateKeyAction.bind(null, companyId), initialActionState);
  useActionFeedback(state, () => formRef.current?.reset());

  return (
    <form ref={formRef} action={formAction}>
      <FieldGroup>
        {state.status === 'error' && <FormMessage status="error" message={state.message} />}
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
        <div>
          <SubmitButton>Aktiválás</SubmitButton>
        </div>
      </FieldGroup>
    </form>
  );
}
