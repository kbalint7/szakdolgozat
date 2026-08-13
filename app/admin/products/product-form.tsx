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
    <form action={formAction} className="max-w-2xl">
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
          label="Azonosító (slug)"
          description="Ezzel hivatkozik a termékre a szoftver az ellenőrzéskor, pl. ide-pro."
          defaultValue={values?.slug ?? defaultValues?.slug}
          errors={errors.slug}
          required
        />
        <TextField
          name="summary"
          label="Rövid leírás"
          description="A katalógus listájában jelenik meg."
          defaultValue={values?.summary ?? defaultValues?.summary}
          errors={errors.summary}
        />
        <TextareaField
          name="description"
          label="Leírás"
          rows={6}
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
