'use client';

import { useId } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type TextFieldProps = Omit<React.ComponentProps<typeof Input>, 'name'> & {
  name: string;
  label: string;
  description?: React.ReactNode;
  optional?: boolean;
  errors?: string[];
  invalid?: boolean;
};

export function Optional() {
  return <span className="font-normal text-muted-foreground">(nem kötelező)</span>;
}

export function TextField({
  name,
  label,
  description,
  optional,
  errors,
  invalid: refused = false,
  id,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? `${name}-${generatedId}`;
  const invalid = Boolean(errors?.length);
  return (
    <Field data-invalid={invalid || refused || undefined}>
      <FieldLabel htmlFor={inputId}>
        {label}
        {optional && <Optional />}
      </FieldLabel>
      <Input id={inputId} name={name} aria-invalid={invalid || refused || undefined} {...props} />
      {description && !invalid && <FieldDescription>{description}</FieldDescription>}
      {invalid && <FieldError errors={errors!.map(message => ({ message }))} />}
    </Field>
  );
}
