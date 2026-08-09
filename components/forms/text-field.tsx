'use client';

import { useId } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type TextFieldProps = Omit<React.ComponentProps<typeof Input>, 'name'> & {
  name: string;
  label: string;
  description?: React.ReactNode;
  errors?: string[];
};

export function TextField({ name, label, description, errors, id, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? `${name}-${generatedId}`;
  const invalid = Boolean(errors?.length);
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Input id={inputId} name={name} aria-invalid={invalid || undefined} {...props} />
      {description && <FieldDescription>{description}</FieldDescription>}
      {invalid && <FieldError errors={errors!.map(message => ({ message }))} />}
    </Field>
  );
}
