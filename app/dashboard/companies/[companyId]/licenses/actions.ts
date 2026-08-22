'use server';

import { refresh } from 'next/cache';

import { failure, success, validationError, type ActionState } from '@/lib/action-state';
import { authorizeCompanyAction } from '@/lib/auth/company';
import { activateLicenseKey } from '@/lib/services/orders';
import { reconcileCompany } from '@/lib/services/pools';
import { activateKeySchema } from '@/lib/validation/orders';

export async function activateKeyAction(
  companyId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = activateKeySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error, formData);

  let message: string;
  try {
    const ctx = await authorizeCompanyAction(companyId, 'licenses.activate');
    const { license, pool } = await activateLicenseKey(ctx.actor, companyId, parsed.data.key);
    const granted = pool.actions.filter(action => action.type === 'ASSIGN').length;
    message = `Licenc aktiválva: ${license.seatCount} hely. ${granted} munkavállaló kapott most helyet.`;
  } catch (error) {
    return failure(error, formData);
  }
  refresh();
  return success(message);
}

export async function reconcileAction(companyId: string): Promise<ActionState> {
  let changes: number;
  try {
    const ctx = await authorizeCompanyAction(companyId, 'pools.reconcile');
    changes = (await reconcileCompany(companyId, ctx.actor)).changes;
  } catch (error) {
    return failure(error);
  }
  refresh();
  return success(
    changes === 0 ? 'Az állapot konzisztens, nem volt szükség változtatásra.' : `Újraszámolva: ${changes} változás.`,
  );
}
