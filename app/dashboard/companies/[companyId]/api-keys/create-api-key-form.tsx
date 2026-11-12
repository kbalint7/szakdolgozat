'use client';

import { useActionState } from 'react';

import { Mono } from '@/components/code';
import { FormMessage } from '@/components/forms/form-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { TextField } from '@/components/forms/text-field';
import { SecretReveal } from '@/components/secret-reveal';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import type { ActionState } from '@/lib/action-state';

import { createApiKeyAction } from './actions';
import { apiKeyScopes as scopes } from './scopes';

const initialState: ActionState<{ token: string }> = { status: 'idle' };

export function CreateApiKeyForm({ companyId }: { companyId: string }) {
  const [state, formAction] = useActionState(createApiKeyAction.bind(null, companyId), initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction}>
        <FieldGroup>
          {state.status === 'error' && <FormMessage status="error" message={state.message} />}
          <TextField
            name="name"
            label="Név"
            placeholder="pl. HR-rendszer"
            defaultValue={state.status === 'error' ? state.values?.name : undefined}
            errors={errors.name}
            required
          />
          <FieldSet className="gap-3">
            <FieldLegend variant="label">Jogosultságok</FieldLegend>
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {scopes.map(scope => (
                <Field key={scope.value} orientation="horizontal">
                  <Checkbox id={`scope-${scope.value}`} name="scopes" value={scope.value} defaultChecked />
                  <FieldContent>
                    <FieldLabel htmlFor={`scope-${scope.value}`} className="font-normal">
                      {scope.label}
                    </FieldLabel>
                    <FieldDescription>
                      <Mono>{scope.value}</Mono>
                    </FieldDescription>
                  </FieldContent>
                </Field>
              ))}
            </div>
            {errors.scopes && <FieldError errors={errors.scopes.map(message => ({ message }))} />}
          </FieldSet>
          <div>
            <SubmitButton>Kulcs létrehozása</SubmitButton>
          </div>
        </FieldGroup>
      </form>
      {state.status === 'success' && state.data && (
        <SecretReveal
          label="Új API-kulcs"
          value={state.data.token}
          note="Másold be a HR-rendszer beállításaiba. Később nem tudjuk újra megmutatni."
        />
      )}
    </div>
  );
}
