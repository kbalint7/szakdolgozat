'use client';

import { useActionState } from 'react';

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

const scopes = [
  { value: 'hr:events:write', label: 'hr:events:write', description: 'HR-események beküldése' },
  { value: 'hr:events:read', label: 'hr:events:read', description: 'Események feldolgozási állapotának lekérdezése' },
];

const initialState: ActionState<{ token: string }> = { status: 'idle' };

export function CreateApiKeyForm({ companyId }: { companyId: string }) {
  const [state, formAction] = useActionState(createApiKeyAction.bind(null, companyId), initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="max-w-xl">
        <FieldGroup>
          {state.status === 'error' && <FormMessage status="error" message={state.message} />}
          <TextField
            name="name"
            label="Név"
            placeholder="pl. HR-szimulátor"
            defaultValue={state.status === 'error' ? state.values?.name : undefined}
            errors={errors.name}
            required
          />
          <FieldSet>
            <FieldLegend variant="label">Jogosultságok</FieldLegend>
            {scopes.map(scope => (
              <Field key={scope.value} orientation="horizontal">
                <Checkbox id={`scope-${scope.value}`} name="scopes" value={scope.value} defaultChecked />
                <FieldContent>
                  <FieldLabel htmlFor={`scope-${scope.value}`} className="font-mono">
                    {scope.label}
                  </FieldLabel>
                  <FieldDescription>{scope.description}</FieldDescription>
                </FieldContent>
              </Field>
            ))}
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
