'use client';

import { cn } from 'cn';
import { SearchIcon, XIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useTransition } from 'react';

import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';

export function FilterBar({
  children,
  keep,
  className,
}: {
  children: React.ReactNode;
  keep?: Record<string, string | undefined>;
  className?: string;
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [pending, startTransition] = useTransition();

  useEffect(() => () => clearTimeout(timer.current), []);

  function apply() {
    clearTimeout(timer.current);
    if (!form.current) return;
    delete form.current.dataset.typing;
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form.current)) {
      if (typeof value === 'string' && value.trim()) params.set(key, value.trim());
    }
    const query = params.toString();
    const path = window.location.pathname;
    startTransition(() => router.replace(query ? `${path}?${query}` : path, { scroll: false }));
  }

  return (
    <form
      ref={form}
      role="search"
      data-slot="filter-bar"
      data-pending={pending || undefined}
      className={cn('flex flex-wrap items-center gap-2', className)}
      onSubmit={event => {
        event.preventDefault();
        apply();
      }}
      onInput={event => {
        const target = event.target;
        if (target instanceof HTMLInputElement && target.type !== 'date') {
          clearTimeout(timer.current);
          timer.current = setTimeout(apply, 350);
          event.currentTarget.dataset.typing = 'true';
        }
      }}
      onChange={event => {
        const target = event.target;
        if (target instanceof HTMLSelectElement || (target instanceof HTMLInputElement && target.type === 'date')) {
          apply();
        }
      }}
    >
      {keep &&
        Object.entries(keep).map(([name, value]) =>
          value ? <input key={name} type="hidden" name={name} value={value} /> : null,
        )}
      {children}
      <button type="submit" tabIndex={-1} className="sr-only">
        Szűrés
      </button>
    </form>
  );
}

function useUrlValue<T extends HTMLInputElement | HTMLSelectElement>(value: string) {
  const control = useRef<T>(null);
  useEffect(() => {
    const element = control.current;
    if (!element || element === document.activeElement || element.form?.dataset.typing) return;
    if (element.value !== value) element.value = value;
  }, [value]);
  return control;
}

export function FilterSearch({
  name = 'q',
  placeholder = 'Keresés',
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'type' | 'ref'>) {
  const input = useUrlValue<HTMLInputElement>(String(props.defaultValue ?? ''));
  return (
    <div className={cn('relative w-full sm:w-72', className)}>
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={input}
        type="search"
        name={name}
        placeholder={placeholder}
        aria-label={props['aria-label'] ?? placeholder}
        autoComplete="off"
        className="bg-card pl-8 dark:bg-input/30 [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
    </div>
  );
}

export function FilterSelect({ className, ...props }: Omit<React.ComponentProps<typeof NativeSelect>, 'ref'>) {
  const select = useUrlValue<HTMLSelectElement>(String(props.defaultValue ?? ''));
  return (
    <NativeSelect
      ref={select}
      className={cn('w-full sm:w-auto [&>select]:bg-card dark:[&>select]:bg-input/30', className)}
      {...props}
    />
  );
}

export function FilterReset({ href, className }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      onClick={event => {
        const form = event.currentTarget.closest('form');
        if (!form) return;
        let first: HTMLElement | undefined;
        for (const control of form.elements) {
          if (control instanceof HTMLInputElement && control.type !== 'hidden') control.value = '';
          else if (control instanceof HTMLSelectElement) control.selectedIndex = 0;
          else continue;
          first ??= control;
        }
        if (event.detail === 0) first?.focus({ preventScroll: true });
      }}
      className={cn(
        'inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <XIcon aria-hidden className="size-3.5" /> Szűrők törlése
    </Link>
  );
}
