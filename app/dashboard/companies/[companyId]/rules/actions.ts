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
    const outcome =
      queued === 0
        ? 'Jelenleg nincs ilyen munkakörű aktív munkavállaló.'
        : queued === 1
          ? granted === 1
            ? 'Egy munkavállalónak jár a szoftver, és helyet is kapott.'
            : 'Egy munkavállalónak jár a szoftver, de nem jutott neki hely, ezért várólistára került.'
          : granted === queued
            ? `${queued} munkavállalónak jár a szoftver, és mind helyet kapott.`
            : granted === 0
              ? `${queued} munkavállalónak jár a szoftver, de egyiküknek sem jutott hely, ezért várólistára kerültek.`
              : `${queued} munkavállalónak jár a szoftver, közülük ${granted} kapott helyet, ${queued - granted} várólistára került.`;
    message = `A szabályt létrehoztuk. ${outcome}`;
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
    const outcome =
      revoked + cancelled === 0
        ? 'Senki sem veszített el helyet.'
        : cancelled === 0
          ? `${revoked} munkavállaló elvesztette a helyét.`
          : revoked === 0
            ? `${cancelled} munkavállaló lekerült a várólistáról.`
            : `${revoked} munkavállaló elvesztette a helyét, ${cancelled} lekerült a várólistáról.`;
    message = `A szabályt töröltük. ${outcome}`;
  } catch (error) {
    return failure(error);
  }
  refresh();
  return success(message);
}
