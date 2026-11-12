'use client';

import { cn } from 'cn';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';

export function DateInput({
  name,
  label,
  defaultValue,
  className,
  ...props
}: {
  name: string;
  label: string;
  defaultValue?: string;
  className?: string;
  'aria-label'?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const openOnClick = useRef(false);
  const [focused, setFocused] = useState(false);
  const [filled, setFilled] = useState(Boolean(defaultValue));

  const [seen, setSeen] = useState(defaultValue);
  if (seen !== defaultValue) {
    setSeen(defaultValue);
    setFilled(Boolean(defaultValue));
  }
  useEffect(() => {
    const element = input.current;
    if (element && element !== document.activeElement) element.value = defaultValue ?? '';
  }, [defaultValue]);

  const asDate = focused || filled;

  return (
    <div className={cn('relative', className)}>
      <Input
        ref={input}
        type={asDate ? 'date' : 'text'}
        inputMode={asDate ? undefined : 'none'}
        name={name}
        defaultValue={defaultValue}
        placeholder={label}
        aria-label={props['aria-label'] ?? label}
        autoComplete="off"
        onPointerDown={() => {
          openOnClick.current = !asDate;
        }}
        onClick={() => {
          if (!openOnClick.current) return;
          openOnClick.current = false;
          requestAnimationFrame(() => {
            try {
              input.current?.showPicker();
            } catch {}
          });
        }}
        onFocus={() => setFocused(true)}
        onBlur={event => {
          setFocused(false);
          setFilled(Boolean(event.target.value));
        }}
        onChange={event => setFilled(Boolean(event.target.value))}
        className={cn(
          'nums cursor-pointer bg-card pr-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-y-0 [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-9 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-datetime-edit]:p-0',
          asDate && 'cursor-text',
        )}
      />
      <CalendarIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
