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
        message = 'Az esemény feldolgozva, a helyek frissültek.';
        break;
      case 'stale':
        message = 'Az esemény régebbi, mint a munkavállaló jelenlegi állapota, ezért nem változtatott semmin.';
        break;
      case 'failed':
        return { status: 'error', message: `A feldolgozás nem sikerült: ${result.error}` };
      default:
        message = 'Az esemény rögzítve.';
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
  return success('A fiókot összekapcsoltuk a munkavállalóval: mostantól ő használhatja a helyét.');
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
    'A kapcsolatot megszüntettük. A hely megmarad, de a szoftvert nem lehet használni, amíg nincs összekapcsolt fiók.',
  );
}
