'use client';

import { useActionState, useState } from 'react';

import { CheckboxField } from '@/components/forms/fields';
import { FormMessage } from '@/components/forms/form-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { TextField } from '@/components/forms/text-field';
import { useActionFeedback } from '@/components/forms/use-action-feedback';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { initialActionState, type ActionState } from '@/lib/action-state';

import { savePlanAction } from './actions';

type PlanValues = {
  id: string;
  name: string;
  seatCount: number;
  durationDays: number | null;
  priceHuf: number;
  isActive: boolean;
};

function PlanForm({ productId, plan, onSaved }: { productId: string; plan?: PlanValues; onSaved: () => void }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    savePlanAction.bind(null, productId, plan?.id ?? null),
    initialActionState,
  );
  useActionFeedback(state, onSaved);
  const values = state.values;
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction}>
      <FieldGroup>
        {state.status === 'error' && <FormMessage status="error" message={state.message} />}
        <TextField
          name="name"
          label="Név"
          placeholder="pl. Csapat – 20 hely, 12 hónap"
          defaultValue={values?.name ?? plan?.name}
          errors={errors.name}
          required
        />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            name="seatCount"
            label="Helyek száma"
            type="number"
            min={1}
            inputMode="numeric"
            defaultValue={values?.seatCount ?? plan?.seatCount}
            errors={errors.seatCount}
            required
          />
          <TextField
            name="priceHuf"
            label="Ár (Ft)"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={values?.priceHuf ?? plan?.priceHuf}
            errors={errors.priceHuf}
            required
          />
        </div>
        <TextField
          name="durationDays"
          label="Időtartam (nap)"
          type="number"
          min={1}
          inputMode="numeric"
          description="Hagyd üresen a határozatlan idejű (örökös) licenchez."
          defaultValue={values?.durationDays ?? plan?.durationDays ?? ''}
          errors={errors.durationDays}
        />
        <CheckboxField
          name="isActive"
          label="Vásárolható"
          defaultChecked={values ? values.isActive === 'on' : (plan?.isActive ?? true)}
        />
      </FieldGroup>
      <DialogFooter className="mt-6">
        <SubmitButton>{plan ? 'Mentés' : 'Létrehozás'}</SubmitButton>
      </DialogFooter>
    </form>
  );
}

export function PlanDialog({
  productId,
  plan,
  trigger,
}: {
  productId: string;
  plan?: PlanValues;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{plan ? 'Csomag szerkesztése' : 'Új csomag'}</DialogTitle>
          <DialogDescription>
            A módosítás csak az új vásárlásokra vonatkozik; a meglévő licencek megtartják a helyek számát.
          </DialogDescription>
        </DialogHeader>
        {open && <PlanForm productId={productId} plan={plan} onSaved={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

export function NewPlanButton({ productId }: { productId: string }) {
  return <PlanDialog productId={productId} trigger={<Button>Új csomag</Button>} />;
}
