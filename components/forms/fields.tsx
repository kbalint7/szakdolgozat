'use client';

import { useId } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';

function Errors({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <FieldError errors={errors.map(message => ({ message }))} />;
}

type TextareaFieldProps = Omit<React.ComponentProps<typeof Textarea>, 'name'> & {
  name: string;
  label: string;
  description?: React.ReactNode;
  errors?: string[];
};

export function TextareaField({ name, label, description, errors, id, ...props }: TextareaFieldProps) {
  const generatedId = useId();
  const inputId = id ?? `${name}-${generatedId}`;
  const invalid = Boolean(errors?.length);
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Textarea id={inputId} name={name} aria-invalid={invalid || undefined} {...props} />
      {description && <FieldDescription>{description}</FieldDescription>}
      <Errors errors={errors} />
    </Field>
  );
}

type SelectFieldProps = Omit<React.ComponentProps<'select'>, 'name' | 'size'> & {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  description?: React.ReactNode;
  errors?: string[];
};

export function SelectField({
  name,
  label,
  options,
  placeholder,
  description,
  errors,
  id,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const inputId = id ?? `${name}-${generatedId}`;
  const invalid = Boolean(errors?.length);
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <NativeSelect id={inputId} name={name} aria-invalid={invalid || undefined} className="w-full" {...props}>
        {placeholder !== undefined && <NativeSelectOption value="">{placeholder}</NativeSelectOption>}
        {options.map(option => (
          <NativeSelectOption key={option.value} value={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {description && <FieldDescription>{description}</FieldDescription>}
      <Errors errors={errors} />
    </Field>
  );
}

type CheckboxFieldProps = {
  name: string;
  label: string;
  description?: React.ReactNode;
  defaultChecked?: boolean;
  errors?: string[];
};

export function CheckboxField({ name, label, description, defaultChecked, errors }: CheckboxFieldProps) {
  const inputId = `${name}-${useId()}`;
  return (
    <Field orientation="horizontal" data-invalid={errors?.length ? true : undefined}>
      <Checkbox id={inputId} name={name} defaultChecked={defaultChecked} />
      <FieldContent>
        <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
        <Errors errors={errors} />
      </FieldContent>
    </Field>
  );
}
