'use server';

import { refresh } from 'next/cache';

import { failure, success, validationError, type ActionState } from '@/lib/action-state';
import { requirePlatformAdmin } from '@/lib/auth/session';
import { issueManualKey, revokeLicense, revokeLicenseKey } from '@/lib/services/orders';
import { issueKeySchema } from '@/lib/validation/orders';

export async function issueKeyAction(
  _prev: ActionState<{ licenseKey: string }>,
  formData: FormData,
): Promise<ActionState<{ licenseKey: string }>> {
  const admin = await requirePlatformAdmin();
  const parsed = issueKeySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error, formData);

  let licenseKey: string;
  try {
    licenseKey = (await issueManualKey({ type: 'user', id: admin.id }, parsed.data.planId)).licenseKey;
  } catch (error) {
    return failure(error, formData);
  }
  refresh();
  return success('A licenckulcs elkészült.', { licenseKey });
}

export async function revokeLicenseAction(licenseId: string): Promise<ActionState> {
  const admin = await requirePlatformAdmin();
  try {
    await revokeLicense({ type: 'user', id: admin.id }, licenseId);
  } catch (error) {
    return failure(error);
  }
  refresh();
  return success('A licencet visszavontuk, a helyeket újraszámoltuk.');
}

export async function revokeLicenseKeyAction(licenseKeyId: string): Promise<ActionState> {
  const admin = await requirePlatformAdmin();
  try {
    await revokeLicenseKey({ type: 'user', id: admin.id }, licenseKeyId);
  } catch (error) {
    return failure(error);
  }
  refresh();
  return success('A licenckulcsot visszavontuk.');
}
