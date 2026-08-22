'use server';

import { refresh } from 'next/cache';

import { failure, success, validationError, type ActionState } from '@/lib/action-state';
import { authorizeCompanyAction } from '@/lib/auth/company';
import { purchasePlan } from '@/lib/services/orders';
import { purchaseSchema } from '@/lib/validation/orders';

export type PurchaseData = {
  companyId: string;
  licenseKey: string;
  activated: boolean;
  seatCount?: number;
  assigned?: number;
  waiting?: number;
};

export async function purchaseAction(
  planId: string,
  _prev: ActionState<PurchaseData>,
  formData: FormData,
): Promise<ActionState<PurchaseData>> {
  const parsed = purchaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error, formData);
  const { companyId, activate } = parsed.data;

  let data: PurchaseData;
  try {
    const ctx = await authorizeCompanyAction(companyId, activate ? 'licenses.activate' : 'licenses.purchase');
    const result = await purchasePlan({ type: 'user', id: ctx.user.id }, companyId, planId, { activate });
    data = {
      companyId,
      licenseKey: result.licenseKey,
      activated: Boolean(result.license),
      seatCount: result.license?.seatCount,
      assigned: result.pool?.assigned,
      waiting: result.pool?.waiting,
    };
  } catch (error) {
    return failure(error, formData);
  }
  refresh();
  return success(data.activated ? 'Sikeres vásárlás, a licenc aktiválva.' : 'Sikeres vásárlás.', data);
}
