'use client';

import { cn } from 'cn';
import { ChevronDownIcon } from 'lucide-react';
import { useId } from 'react';

import { DateInput } from '@/components/audit/date-input';
import { FilterBar, FilterReset, FilterSearch, FilterSelect } from '@/components/filter-bar';
import { buttonVariants } from '@/components/ui/button';
import { NativeSelectOption } from '@/components/ui/native-select';
import { AUDIT_CATEGORIES } from '@/lib/domain/audit';

export const categoryLabels: Record<string, string> = {
  seat: 'Helyek',
  employee: 'Munkavállalók',
  hr_event: 'HR-események',
  rule: 'Szabályok',
  license: 'Licencek',
  license_key: 'Licenckulcsok',
  order: 'Rendelések',
  membership: 'Tagságok',
  invitation: 'Meghívók',
  api_key: 'API-kulcsok',
  client_token: 'Klienstokenek',
  company: 'Cég',
  product: 'Termékek',
  plan: 'Csomagok',
};

const searches = {
  hrId: { placeholder: 'HR-azonosító', label: 'Munkavállaló HR-azonosítója' },
  company: { placeholder: 'Cég', label: 'Cég neve' },
} as const;

export function AuditFilters({
  values,
  resetHref,
  search = 'hrId',
}: {
  values: { category?: string; hrId?: string; company?: string; from?: string; to?: string };
  resetHref: string;
  search?: keyof typeof searches;
}) {
  const { category = '' } = values;
  const term = values[search] ?? '';
  const active = [values.category, term, values.from, values.to].filter(Boolean).length;
  const filtered = active > 0;

  const id = useId();
  const toggleId = `${id}-open`;
  const panelId = `${id}-panel`;

  return (
    <div className="flex flex-col gap-3">
      <input
        id={toggleId}
        type="checkbox"
        defaultChecked={filtered}
        aria-controls={panelId}
        onKeyDown={event => {
          if (event.key !== 'Enter') return;
          event.preventDefault();
          event.currentTarget.click();
        }}
        className="peer sr-only md:hidden"
      />
      <label
        htmlFor={toggleId}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'w-fit cursor-pointer bg-card peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 md:hidden peer-checked:[&>svg]:rotate-180',
        )}
      >
        Szűrők
        {filtered && <span className="nums font-normal text-muted-foreground">({active})</span>}
        <ChevronDownIcon aria-hidden className="text-muted-foreground transition-transform" />
      </label>
      <div id={panelId} className="hidden peer-checked:block md:block">
        <FilterBar>
          <FilterSearch
            name={search}
            defaultValue={term}
            placeholder={searches[search].placeholder}
            aria-label={searches[search].label}
            className="sm:w-52"
          />
          <FilterSelect name="category" defaultValue={category} aria-label="Művelet típusa">
            <NativeSelectOption value="">Minden művelet</NativeSelectOption>
            {AUDIT_CATEGORIES.map(item => (
              <NativeSelectOption key={item} value={item}>
                {categoryLabels[item]}
              </NativeSelectOption>
            ))}
          </FilterSelect>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <DateInput
              name="from"
              label="Ettől"
              aria-label="Ettől a naptól"
              defaultValue={values.from}
              className="sm:w-36"
            />
            <DateInput
              name="to"
              label="Eddig"
              aria-label="Eddig a napig"
              defaultValue={values.to}
              className="sm:w-36"
            />
          </div>
          {filtered && <FilterReset href={resetHref} />}
        </FilterBar>
      </div>
    </div>
  );
}
