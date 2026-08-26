'use server';

import { refresh } from 'next/cache';

import { failure, success, validationError, type ActionState } from '@/lib/action-state';
import { authorizeCompanyAction } from '@/lib/auth/company';
import { createRule, deleteRule } from '@/lib/services/rules';
import { ruleSchema } from '@/lib/validation/rules';

export async function createRuleAction(
  companyId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = ruleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error, formData);

  let message: string;
  try {
    const ctx = await authorizeCompanyAction(companyId, 'rules.manage');
    const { pool } = await createRule({ type: 'user', id: ctx.user.id }, companyId, parsed.data);
    const queued = pool.actions.filter(action => action.type === 'ENQUEUE').length;
    const granted = pool.actions.filter(action => action.type === 'ASSIGN').length;
    message =
      queued === 0
        ? 'A szabály létrejött. Jelenleg nincs ilyen munkakörű aktív munkavállaló.'
        : `A szabály létrejött: ${queued} munkavállaló lett jogosult, ${granted} kapott helyet, ${queued - granted} várólistára került.`;
  } catch (error) {
    return failure(error, formData);
  }
  refresh();
  return success(message);
}

export async function deleteRuleAction(companyId: string, ruleId: string): Promise<ActionState> {
  let message: string;
  try {
    const ctx = await authorizeCompanyAction(companyId, 'rules.manage');
    const { pool } = await deleteRule(ctx.actor, companyId, ruleId);
    const revoked = pool.actions.filter(action => action.type === 'REVOKE').length;
    const cancelled = pool.actions.filter(action => action.type === 'CANCEL').length;
    message = `A szabály törölve: ${revoked} hely visszavonva, ${cancelled} várólista-bejegyzés törölve.`;
  } catch (error) {
    return failure(error);
  }
  refresh();
  return success(message);
}
