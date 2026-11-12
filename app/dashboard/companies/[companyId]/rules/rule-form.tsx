'use client';

import { useActionState, useRef, useState } from 'react';

import { Callout } from '@/components/callout';
import { SelectField } from '@/components/forms/fields';
import { FormMessage } from '@/components/forms/form-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { TextField } from '@/components/forms/text-field';
import { useActionFeedback } from '@/components/forms/use-action-feedback';
import { FieldGroup } from '@/components/ui/field';
import { initialActionState } from '@/lib/action-state';

import { createRuleAction } from './actions';

export function RuleForm({
  companyId,
  products,
  jobRoles,
}: {
  companyId: string;
  products: { id: string; name: string; hasCapacity: boolean }[];
  jobRoles: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(createRuleAction.bind(null, companyId), initialActionState);
  const [productId, setProductId] = useState(state.values?.productId ?? products[0]?.id ?? '');
  useActionFeedback(state, () => formRef.current?.reset());
  const selected = products.find(product => product.id === productId);

  return (
    <form ref={formRef} action={formAction}>
      <FieldGroup>
        {state.status === 'error' && <FormMessage status="error" message={state.message} />}
        <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2">
          <TextField
            name="jobRole"
            label="Munkakör"
            placeholder="pl. developer"
            list="known-job-roles"
            autoComplete="off"
            description="Úgy írd, ahogy a HR-rendszer küldi."
            defaultValue={state.values?.jobRole}
            errors={state.fieldErrors?.jobRole}
            required
          />
          <datalist id="known-job-roles">
            {jobRoles.map(role => (
              <option key={role} value={role} />
            ))}
          </datalist>
          <SelectField
            name="productId"
            label="Szoftver"
            options={products.map(product => ({ value: product.id, label: product.name }))}
            value={productId}
            onChange={event => setProductId(event.target.value)}
            errors={state.fieldErrors?.productId}
          />
        </div>
        {selected && !selected.hasCapacity && (
          <Callout tone="warning">
            Ehhez a szoftverhez nincs érvényes licenc. Akinek jár, várólistára kerül, amíg nem aktiválsz egyet.
          </Callout>
        )}
        <div>
          <SubmitButton>Szabály létrehozása</SubmitButton>
        </div>
      </FieldGroup>
    </form>
  );
}
