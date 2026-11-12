'use server';

import { randomUUID } from 'node:crypto';

import { refresh } from 'next/cache';

import { failure, success, validationError, type ActionState } from '@/lib/action-state';
import { authorizeCompanyAction } from '@/lib/auth/company';
import { ingestEvent, processEvent } from '@/lib/services/hr-events';
import { linkMemberToEmployee, unlinkEmployee } from '@/lib/services/invitations';
import { linkMemberSchema } from '@/lib/validation/company';
import { manualEventSchema } from '@/lib/validation/hr';

export async function submitManualEventAction(
  companyId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = manualEventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error, formData);
  const { type, hrId, name, email, jobRole, occurredAt } = parsed.data;

  let message: string;
  try {
    const ctx = await authorizeCompanyAction(companyId, 'employees.manage');
    const ingested = await ingestEvent(
      { companyId, source: 'ui', userId: ctx.user.id },
      { eventId: `ui-${randomUUID()}`, type, occurredAt, employee: { hrId, name, email, jobRole } },
    );
    const result = await processEvent(ingested.id);
    switch (result.outcome) {
      case 'processed':
        message = 'Az eseményt feldolgoztuk, és frissítettük a helyeket.';
        break;
      case 'stale':
        message = 'Ennél frissebb adatunk van a munkavállalóról, ezért nem változott semmi.';
        break;
      case 'failed':
        return {
          status: 'error',
          message: result.retryAt
            ? 'Az eseményt rögzítettük, de nem sikerült feldolgozni. Hamarosan újra megpróbáljuk. A részleteket a HR-események között találod.'
            : 'Az eseményt rögzítettük, de nem sikerült feldolgozni. A részleteket a HR-események között találod.',
        };
      default:
        message = 'Az eseményt rögzítettük.';
    }
  } catch (error) {
    return failure(error, formData);
  }
  refresh();
  return success(message);
}

export async function linkEmployeeAction(
  companyId: string,
  employeeId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = linkMemberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error, formData);
  try {
    const ctx = await authorizeCompanyAction(companyId, 'employees.manage');
    await linkMemberToEmployee(ctx.actor, companyId, employeeId, parsed.data.membershipId);
  } catch (error) {
    return failure(error, formData);
  }
  refresh();
  return success(
    'A fiókot összekapcsoltuk a munkavállalóval. Ezzel a fiókkal használhatja a szoftvereket, amelyekből helye van.',
  );
}

export async function unlinkEmployeeAction(companyId: string, employeeId: string): Promise<ActionState> {
  try {
    const ctx = await authorizeCompanyAction(companyId, 'employees.manage');
    await unlinkEmployee(ctx.actor, companyId, employeeId);
  } catch (error) {
    return failure(error);
  }
  refresh();
  return success(
    'A fiókot leválasztottuk. A munkavállaló nem tudja használni a cég szoftvereit, amíg nincs összekapcsolt fiókja.',
  );
}
