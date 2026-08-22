'use client';

import { CircleCheckIcon } from 'lucide-react';
import { useActionState, useCallback, useLayoutEffect, useState } from 'react';

import { CheckboxField, SelectField } from '@/components/forms/fields';
import { FormMessage } from '@/components/forms/form-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { LinkButton } from '@/components/link-button';
import { SecretReveal } from '@/components/secret-reveal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FieldGroup } from '@/components/ui/field';
import type { ActionState } from '@/lib/action-state';

import { purchaseAction, type PurchaseData } from '../actions';

const initialState: ActionState<PurchaseData> = { status: 'idle' };

type PurchaseFormProps = {
  planId: string;
  priceLabel: string;
  companies: { id: string; name: string }[];
};

export function PurchaseForm(props: PurchaseFormProps) {
  const [visit, setVisit] = useState(0);
  const startNextVisitFresh = useCallback(() => setVisit(previous => previous + 1), []);
  return <PurchaseFormBody key={visit} {...props} onHiddenAfterSubmit={startNextVisitFresh} />;
}

function PurchaseFormBody({
  planId,
  priceLabel,
  companies,
  onHiddenAfterSubmit,
}: PurchaseFormProps & { onHiddenAfterSubmit: () => void }) {
  const [state, formAction] = useActionState(purchaseAction.bind(null, planId), initialState);
  const submitted = state.status !== 'idle';

  useLayoutEffect(() => {
    if (!submitted) return;
    return () => onHiddenAfterSubmit();
  }, [submitted, onHiddenAfterSubmit]);

  if (state.status === 'success' && state.data) {
    const { data } = state;
    return (
      <div className="flex flex-col gap-4">
        <Alert>
          <CircleCheckIcon />
          <AlertTitle>Sikeres vásárlás</AlertTitle>
          <AlertDescription>
            {data.activated
              ? `A licenc aktiválva (${data.seatCount} hely). Jelenleg ${data.assigned} hely kiosztva, ${data.waiting} munkavállaló vár.`
              : 'A licenckulcsot bármelyik céged licencoldalán aktiválhatod.'}
          </AlertDescription>
        </Alert>
        {!data.activated && <SecretReveal label="Licenckulcs" value={data.licenseKey} />}
        <div className="flex flex-wrap gap-2">
          <LinkButton href={`/dashboard/companies/${data.companyId}/licenses`}>Licencek és helyek</LinkButton>
          <LinkButton href="/products" variant="outline">
            Vissza a termékekhez
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <FieldGroup>
        {state.status === 'error' && <FormMessage status="error" message={state.message} />}
        <SelectField
          name="companyId"
          label="Cég"
          options={companies.map(company => ({ value: company.id, label: company.name }))}
          defaultValue={state.values?.companyId ?? companies[0]?.id}
          errors={state.fieldErrors?.companyId}
        />
        <CheckboxField
          name="activate"
          label="Aktiválás azonnal ebben a cégben"
          description="Kikapcsolva csak a licenckulcsot kapod meg, amit később aktiválhatsz."
          defaultChecked={state.values ? state.values.activate === 'on' : true}
        />
        <p className="text-sm text-muted-foreground">
          Valódi fizetés nem történik. A rendelés {priceLabel} értékben rögzül.
        </p>
        <div>
          <SubmitButton>Vásárlás megerősítése</SubmitButton>
        </div>
      </FieldGroup>
    </form>
  );
}
