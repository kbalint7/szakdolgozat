'use client';

import { useActionState } from 'react';

import { TextareaField } from '@/components/forms/fields';
import { FormMessage } from '@/components/forms/form-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { TextField } from '@/components/forms/text-field';
import { useActionFeedback } from '@/components/forms/use-action-feedback';
import { FieldGroup } from '@/components/ui/field';
import { initialActionState, type ActionState } from '@/lib/action-state';

type ProductFormProps = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: { name: string; slug: string; summary: string; description: string };
  submitLabel: string;
};

export function ProductForm({ action, defaultValues, submitLabel }: ProductFormProps) {
  const [state, formAction] = useActionState(action, initialActionState);
  useActionFeedback(state);
  const values = state.values;
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction}>
      <FieldGroup>
        {state.status === 'error' && <FormMessage status="error" message={state.message} />}
        <TextField
          name="name"
          label="Név"
          defaultValue={values?.name ?? defaultValues?.name}
          errors={errors.name}
          required
        />
        <TextField
          name="slug"
          label="Azonosító"
          description="Kisbetű, számjegy és kötőjel, pl. ide-pro. A szoftverek ezzel kérdezik le a licencet, ezért ha módosítod, bennük is át kell írni."
          spellCheck={false}
          autoCapitalize="none"
          defaultValue={values?.slug ?? defaultValues?.slug}
          errors={errors.slug}
          required
        />
        <TextareaField
          optional
          name="summary"
          label="Rövid leírás"
          description="A katalógus listájában jelenik meg."
          rows={2}
          defaultValue={values?.summary ?? defaultValues?.summary}
          errors={errors.summary}
        />
        <TextareaField
          optional
          name="description"
          label="Leírás"
          className="min-h-28"
          defaultValue={values?.description ?? defaultValues?.description}
          errors={errors.description}
        />
        <div>
          <SubmitButton>{submitLabel}</SubmitButton>
        </div>
      </FieldGroup>
    </form>
  );
}
