'use client';

import { cn } from 'cn';
import { CalendarIcon } from 'lucide-react';
import { useId, useState } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const display = new Intl.DateTimeFormat('hu-HU', { dateStyle: 'medium', timeStyle: 'short' });

function format(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : display.format(date);
}

export function DateTimeField({
  name,
  label,
  value,
  onChange,
  description,
  errors,
  required,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: React.ReactNode;
  errors?: string[];
  required?: boolean;
}) {
  const id = `${name}-${useId()}`;
  const [focused, setFocused] = useState(false);
  const invalid = Boolean(errors?.length);
  const formatted = format(value);
  const covered = !focused && formatted !== '';
  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type="datetime-local"
          value={value}
          required={required}
          aria-invalid={invalid || undefined}
          onChange={event => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            'nums appearance-none pr-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-y-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-9 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-date-and-time-value]:text-left [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit-fields-wrapper]:p-0',
            covered && 'text-transparent',
          )}
        />
        {covered && (
          <span
            aria-hidden
            suppressHydrationWarning
            className="nums pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-base md:text-sm"
          >
            {formatted}
          </span>
        )}
        <CalendarIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
      {description && !invalid && <FieldDescription>{description}</FieldDescription>}
      {invalid && <FieldError errors={errors!.map(message => ({ message }))} />}
    </Field>
  );
}
