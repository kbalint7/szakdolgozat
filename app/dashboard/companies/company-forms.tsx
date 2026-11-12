'use client';

import { useActionState, useState } from 'react';

import { TextareaField } from '@/components/forms/fields';
import { FormMessage } from '@/components/forms/form-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { TextField } from '@/components/forms/text-field';
import { useActionFeedback } from '@/components/forms/use-action-feedback';
import { FieldGroup } from '@/components/ui/field';
import { initialActionState, type ActionState } from '@/lib/action-state';

type FormAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

export function CompanyForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: FormAction;
  defaultValues?: { name: string; description: string };
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  useActionFeedback(state);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction}>
      <FieldGroup>
        {state.status === 'error' && <FormMessage status="error" message={state.message} />}
        <TextField
          name="name"
          label="Cégnév"
          placeholder="pl. Példa Kft."
          description="A meghívókban is ez a név jelenik meg."
          defaultValue={state.values?.name ?? defaultValues?.name}
          errors={errors.name}
          required
        />
        <TextareaField
          optional
          name="description"
          label="Leírás"
          rows={3}
          defaultValue={state.values?.description ?? defaultValues?.description}
          errors={errors.description}
        />
        <div>
          <SubmitButton>{submitLabel}</SubmitButton>
        </div>
      </FieldGroup>
    </form>
  );
}

export function DeleteCompanyForm({ action, companyName }: { action: FormAction; companyName: string }) {
  const [state, formAction] = useActionState(action, initialActionState);
  const [confirmation, setConfirmation] = useState('');
  const errors = state.fieldErrors ?? {};
  const matches = confirmation.trim() === companyName.trim();

  return (
    <form action={formAction}>
      <FieldGroup>
        {state.status === 'error' && <FormMessage status="error" message={state.message} />}
        <TextField
          name="confirmation"
          label={`A megerősítéshez írd be a cég nevét: ${companyName}`}
          autoComplete="off"
          value={confirmation}
          onChange={event => setConfirmation(event.target.value)}
          errors={errors.confirmation}
          required
        />
        <div>
          <SubmitButton variant="destructive" disabled={!matches}>
            Cég végleges törlése
          </SubmitButton>
        </div>
      </FieldGroup>
    </form>
  );
}
