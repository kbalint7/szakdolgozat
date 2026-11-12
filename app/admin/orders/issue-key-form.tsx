'use client';

import { useActionState, useState } from 'react';

import { SelectField } from '@/components/forms/fields';
import { FormMessage } from '@/components/forms/form-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { SecretReveal } from '@/components/secret-reveal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogCancel,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import type { ActionState } from '@/lib/action-state';

import { issueKeyAction } from './actions';

type Plan = { id: string; label: string };

const initialState: ActionState<{ licenseKey: string }> = { status: 'idle' };

function IssueKeyForm({ plans, onDone }: { plans: Plan[]; onDone: () => void }) {
  const [state, formAction] = useActionState(issueKeyAction, initialState);
  const [chosen, setChosen] = useState(false);

  if (state.status === 'success' && state.data) {
    return (
      <>
        <SecretReveal
          label="Új licenckulcs"
          value={state.data.licenseKey}
          note="Add át az ügyfélnek. Később nem tudjuk újra megmutatni."
        />
        <DialogFooter>
          <Button type="button" className="max-sm:w-full" onClick={onDone}>
            Kész
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <form
      action={formAction}
      onChange={event => setChosen(Boolean(new FormData(event.currentTarget).get('planId')))}
      className="flex flex-col gap-5"
    >
      <FieldGroup>
        {state.status === 'error' && <FormMessage status="error" message={state.message} />}
        <SelectField
          name="planId"
          label="Csomag"
          options={plans.map(plan => ({ value: plan.id, label: plan.label }))}
          placeholder="Válassz csomagot…"
          defaultValue={state.values?.planId ?? ''}
          errors={state.fieldErrors?.planId}
          required
        />
      </FieldGroup>
      <DialogFooter>
        <DialogCancel />
        <SubmitButton disabled={!chosen}>Kulcs kiadása</SubmitButton>
      </DialogFooter>
    </form>
  );
}

export function IssueKeyDialog({ plans }: { plans: Plan[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen} disablePointerDismissal>
      <DialogTrigger render={<Button />}>Kulcs kiadása</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Licenckulcs kiadása kézzel</DialogTitle>
          <DialogDescription>
            Akkor kell, ha a csomagot nem itt vásárolták meg. A kulcsot bármelyik cég aktiválhatja.
          </DialogDescription>
        </DialogHeader>
        <IssueKeyForm plans={plans} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
