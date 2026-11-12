'use client';

import { useActionState, useState } from 'react';

import { DateTimeField } from '@/components/forms/date-time-field';
import { SelectField } from '@/components/forms/fields';
import { FormMessage } from '@/components/forms/form-message';
import { SubmitButton } from '@/components/forms/submit-button';
import { TextField } from '@/components/forms/text-field';
import { useActionFeedback } from '@/components/forms/use-action-feedback';
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
import { initialActionState } from '@/lib/action-state';

import { submitManualEventAction } from './actions';

const typeOptions = [
  { value: 'employee.hired', label: 'Belépés' },
  { value: 'employee.role_changed', label: 'Munkakörváltás' },
  { value: 'employee.terminated', label: 'Kilépés' },
];

function localNow() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function keepValues(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
}

function ManualEventForm({
  companyId,
  jobRoles,
  defaults,
  onDone,
}: {
  companyId: string;
  jobRoles: string[];
  defaults?: { hrId?: string; name?: string; email?: string; jobRole?: string; type?: string };
  onDone: () => void;
}) {
  const [state, formAction] = useActionState(submitManualEventAction.bind(null, companyId), initialActionState);
  const [occurredLocal, setOccurredLocal] = useState(localNow);
  const [type, setType] = useState(defaults?.type ?? 'employee.hired');
  const [hrId, setHrId] = useState(defaults?.hrId ?? '');
  const [jobRole, setJobRole] = useState(defaults?.jobRole ?? '');
  useActionFeedback(state, onDone);
  const values = state.values;
  const errors = state.fieldErrors ?? {};
  const occurredIso = occurredLocal ? new Date(occurredLocal).toISOString() : '';
  const needsJobRole = type !== 'employee.terminated';
  const complete = Boolean(hrId.trim() && occurredLocal && (!needsJobRole || jobRole.trim()));

  return (
    <form action={formAction} onReset={keepValues}>
      <FieldGroup>
        {state.status === 'error' && <FormMessage status="error" message={state.message} />}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SelectField
            name="type"
            label="Esemény"
            options={typeOptions}
            value={type}
            onChange={event => setType(event.target.value)}
            errors={errors.type}
          />
          <TextField
            name="hrId"
            label="HR-azonosító"
            placeholder="pl. E-1042"
            value={hrId}
            onChange={event => setHrId(event.target.value)}
            readOnly={Boolean(defaults?.hrId)}
            errors={errors.hrId}
            required
          />
        </div>
        {needsJobRole && (
          <>
            <TextField
              name="jobRole"
              label="Munkakör"
              placeholder="pl. developer"
              list="manual-event-job-roles"
              autoComplete="off"
              value={jobRole}
              onChange={event => setJobRole(event.target.value)}
              errors={errors.jobRole}
              required
            />
            <datalist id="manual-event-job-roles">
              {jobRoles.map(role => (
                <option key={role} value={role} />
              ))}
            </datalist>
          </>
        )}
        {type === 'employee.hired' && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField
              name="name"
              label="Név"
              optional
              defaultValue={values?.name ?? defaults?.name}
              errors={errors.name}
            />
            <TextField
              name="email"
              label="E-mail-cím"
              type="email"
              optional
              defaultValue={values?.email ?? defaults?.email}
              errors={errors.email}
            />
          </div>
        )}
        <DateTimeField
          name="occurredAtLocal"
          label="Időpont"
          value={occurredLocal}
          onChange={setOccurredLocal}
          description="Ha ennél frissebb adatunk van a munkavállalóról, ez az esemény nem változtat semmin."
          errors={errors.occurredAt}
          required
        />
        <input type="hidden" name="occurredAt" value={occurredIso} />
      </FieldGroup>
      <DialogFooter className="mt-6">
        <DialogCancel />
        <SubmitButton disabled={!complete}>Rögzítés</SubmitButton>
      </DialogFooter>
    </form>
  );
}

export function ManualEventDialog({
  companyId,
  jobRoles,
  defaults,
  trigger,
}: {
  companyId: string;
  jobRoles: string[];
  defaults?: { hrId?: string; name?: string; email?: string; jobRole?: string; type?: string };
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button variant="outline" />}>
        {trigger ? undefined : 'Esemény rögzítése'}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>HR-esemény rögzítése</DialogTitle>
          <DialogDescription>Ugyanúgy dolgozzuk fel, mintha a HR-rendszerből érkezett volna.</DialogDescription>
        </DialogHeader>
        <ManualEventForm companyId={companyId} jobRoles={jobRoles} defaults={defaults} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
