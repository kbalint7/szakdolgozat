import { FilterIcon } from 'lucide-react';

import { LinkButton } from '@/components/link-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
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
  client_token: 'Kliens tokenek',
  company: 'Cég',
  product: 'Termékek',
  plan: 'Csomagok',
};

export function AuditFilters({
  values,
  resetHref,
  showEmployee = true,
}: {
  values: { category?: string; hrId?: string; from?: string; to?: string };
  resetHref: string;
  showEmployee?: boolean;
}) {
  return (
    <form className="grid grid-cols-1 gap-3 rounded-xl bg-card p-3 shadow-card ring-1 ring-foreground/8 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_10rem_10rem_auto]">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="audit-category">Művelet típusa</Label>
        <NativeSelect id="audit-category" name="category" defaultValue={values.category ?? ''} className="w-full">
          <NativeSelectOption value="">Mind</NativeSelectOption>
          {AUDIT_CATEGORIES.map(category => (
            <NativeSelectOption key={category} value={category}>
              {categoryLabels[category]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      {showEmployee ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="audit-hr-id">Munkavállaló (HR-azonosító)</Label>
          <Input id="audit-hr-id" name="hrId" defaultValue={values.hrId} placeholder="pl. E-1042" />
        </div>
      ) : (
        <div />
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="audit-from">Ettől</Label>
        <Input id="audit-from" name="from" type="date" defaultValue={values.from} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="audit-to">Eddig</Label>
        <Input id="audit-to" name="to" type="date" defaultValue={values.to} />
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" variant="secondary">
          <FilterIcon data-icon="inline-start" /> Szűrés
        </Button>
        <LinkButton href={resetHref} variant="ghost">
          Törlés
        </LinkButton>
      </div>
    </form>
  );
}
