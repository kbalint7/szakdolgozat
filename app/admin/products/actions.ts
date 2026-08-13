'use server';

import { refresh, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';

import { failure, success, validationError, type ActionState } from '@/lib/action-state';
import { requirePlatformAdmin } from '@/lib/auth/session';
import { CATALOG_TAG } from '@/lib/data/catalog';
import {
  createPlan,
  createProduct,
  setPlanActive,
  setProductPublished,
  updatePlan,
  updateProduct,
} from '@/lib/services/catalog';
import { planSchema, productSchema } from '@/lib/validation/catalog';

async function adminActor() {
  const admin = await requirePlatformAdmin();
  return { type: 'user' as const, id: admin.id };
}

export async function createProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const actor = await adminActor();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error, formData);

  let productId: string;
  try {
    productId = (await createProduct(actor, parsed.data)).id;
  } catch (error) {
    return failure(error, formData);
  }
  updateTag(CATALOG_TAG);
  redirect(`/admin/products/${productId}`);
}

export async function updateProductAction(
  productId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await adminActor();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error, formData);

  try {
    await updateProduct(actor, productId, parsed.data);
  } catch (error) {
    return failure(error, formData);
  }
  updateTag(CATALOG_TAG);
  refresh();
  return success('A termék adatai elmentve.');
}

export async function setProductPublishedAction(productId: string, isPublished: boolean): Promise<ActionState> {
  const actor = await adminActor();
  try {
    await setProductPublished(actor, productId, isPublished);
  } catch (error) {
    return failure(error);
  }
  updateTag(CATALOG_TAG);
  refresh();
  return success(isPublished ? 'A termék megjelent a katalógusban.' : 'A termék el van rejtve a katalógusból.');
}

export async function savePlanAction(
  productId: string,
  planId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await adminActor();
  const parsed = planSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error, formData);

  try {
    if (planId) await updatePlan(actor, planId, parsed.data);
    else await createPlan(actor, productId, parsed.data);
  } catch (error) {
    return failure(error, formData);
  }
  updateTag(CATALOG_TAG);
  refresh();
  return success(planId ? 'A csomag elmentve.' : 'A csomag létrejött.');
}

export async function setPlanActiveAction(planId: string, isActive: boolean): Promise<ActionState> {
  const actor = await adminActor();
  try {
    await setPlanActive(actor, planId, isActive);
  } catch (error) {
    return failure(error);
  }
  updateTag(CATALOG_TAG);
  refresh();
  return success(isActive ? 'A csomag ismét vásárolható.' : 'A csomag inaktív, nem vásárolható.');
}
