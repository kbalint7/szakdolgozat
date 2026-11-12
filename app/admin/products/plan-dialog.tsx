'use client';

import { MoreHorizontalIcon } from 'lucide-react';
import { useActionState, useId, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { CheckboxField } from '@/components/forms/fields';
import { FormMessage } from '@/components/forms/form-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { Optional, TextField } from '@/components/forms/text-field';
import { useActionFeedback } from '@/components/forms/use-action-feedback';
import { Button } from '@/components/ui/button';
import { Dialog, DialogCancel, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import { initialActionState, type ActionState } from '@/lib/action-state';

import { savePlanAction, setPlanActiveAction } from './actions';

type PlanValues = {
  id: string;
  name: string;
  seatCount: number;
  durationDays: number | null;
  priceHuf: number;
  isActive: boolean;
};

const requiredFields = ['name', 'seatCount', 'priceHuf'];

const durationUnits = [
  { value: 'day', label: 'nap', days: 1 },
  { value: 'month', label: 'hónap', days: 30 },
  { value: 'year', label: 'év', days: 365 },
] as const;

type DurationUnit = (typeof durationUnits)[number]['value'];

const MAX_DURATION_DAYS = 36_500;

function splitDuration(days: number | null | undefined): { amount: string; unit: DurationUnit } {
  if (days === null || days === undefined) return { amount: '', unit: 'year' };
  if (days % 365 === 0) return { amount: String(days / 365), unit: 'year' };
  if (days % 30 === 0) return { amount: String(days / 30), unit: 'month' };
  return { amount: String(days), unit: 'day' };
}

function isFilled(form: HTMLFormElement) {
  const data = new FormData(form);
  return requiredFields.every(name => String(data.get(name) ?? '').trim() !== '');
}

function PlanForm({ productId, plan, onSaved }: { productId: string; plan?: PlanValues; onSaved: () => void }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    savePlanAction.bind(null, productId, plan?.id ?? null),
    initialActionState,
  );
  useActionFeedback(state, onSaved);
  const [filled, setFilled] = useState(Boolean(plan));
  const values = state.values;
  const errors = state.fieldErrors ?? {};

  const durationId = useId();
  const initialDuration = splitDuration(plan?.durationDays);
  const [duration, setDuration] = useState(initialDuration);
  const daysPerUnit = durationUnits.find(unit => unit.value === duration.unit)?.days ?? 1;
  const durationDays = duration.amount.trim() === '' ? '' : String(Number(duration.amount) * daysPerUnit);
  const durationInvalid = Boolean(errors.durationDays?.length);

  return (
    <form
      action={formAction}
      onChange={event => setFilled(isFilled(event.currentTarget))}
      className="flex flex-col gap-5"
    >
      <FieldGroup>
        {state.status === 'error' && <FormMessage status="error" message={state.message} />}
        <TextField
          name="name"
          label="Név"
          placeholder="pl. Csapat"
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
        <Field data-invalid={durationInvalid || undefined}>
          <FieldLabel htmlFor={durationId}>
            Időtartam
            <Optional />
          </FieldLabel>
          <div className="grid grid-cols-2 gap-2 sm:gap-5">
            <Input
              id={durationId}
              name="durationAmount"
              type="number"
              min={1}
              max={Math.floor(MAX_DURATION_DAYS / daysPerUnit)}
              step={1}
              inputMode="numeric"
              aria-invalid={durationInvalid || undefined}
              defaultValue={values?.durationAmount ?? initialDuration.amount}
              onChange={event => setDuration(current => ({ ...current, amount: event.target.value }))}
            />
            <NativeSelect
              key={values?.durationUnit ?? 'initial'}
              name="durationUnit"
              aria-label="Egység"
              className="w-full"
              defaultValue={values?.durationUnit ?? initialDuration.unit}
              onChange={event => setDuration(current => ({ ...current, unit: event.target.value as DurationUnit }))}
            >
              {durationUnits.map(unit => (
                <NativeSelectOption key={unit.value} value={unit.value}>
                  {unit.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <input type="hidden" name="durationDays" value={durationDays} />
          <FieldDescription>Ha üresen hagyod, a csomag nem jár le.</FieldDescription>
          {durationInvalid && <FieldError errors={errors.durationDays!.map(message => ({ message }))} />}
        </Field>
        <CheckboxField
          name="isActive"
          label="Vásárolható"
          defaultChecked={values ? values.isActive === 'on' : (plan?.isActive ?? true)}
        />
      </FieldGroup>
      <DialogFooter>
        <DialogCancel />
        <SubmitButton disabled={!filled}>{plan ? 'Mentés' : 'Létrehozás'}</SubmitButton>
      </DialogFooter>
    </form>
  );
}

function PlanDialog({
  productId,
  plan,
  open,
  onOpenChange,
}: {
  productId: string;
  plan?: PlanValues;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{plan ? 'Csomag szerkesztése' : 'Új csomag'}</DialogTitle>
        </DialogHeader>
        <PlanForm productId={productId} plan={plan} onSaved={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function NewPlanButton({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Új csomag
      </Button>
      <PlanDialog productId={productId} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function PlanRowActions({ productId, plan }: { productId: string; plan: PlanValues }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await setPlanActiveAction(plan.id, !plan.isActive);
      if (result.status === 'error') toast.error(result.message ?? 'Váratlan hiba történt. Próbáld újra.');
      else if (result.message) toast.success(result.message);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="-my-1 -mr-2 text-muted-foreground"
              aria-label={`Műveletek: ${plan.name}`}
              disabled={pending}
            />
          }
        >
          {pending ? <Spinner /> : <MoreHorizontalIcon />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => setEditing(true)}>Szerkesztés</DropdownMenuItem>
          <DropdownMenuItem onClick={toggle}>{plan.isActive ? 'Inaktiválás' : 'Aktiválás'}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <PlanDialog productId={productId} plan={plan} open={editing} onOpenChange={setEditing} />
    </>
  );
}
