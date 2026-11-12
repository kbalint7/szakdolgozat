'use server';

import { refresh } from 'next/cache';

import { failure, success, type ActionState } from '@/lib/action-state';
import { authorizeCompanyAction } from '@/lib/auth/company';
import { retryEvent } from '@/lib/services/hr-events';

export async function retryEventAction(companyId: string, id: string): Promise<ActionState> {
  let result;
  try {
    const ctx = await authorizeCompanyAction(companyId, 'hrEvents.retry');
    result = await retryEvent(ctx.actor, companyId, id);
  } catch (error) {
    return failure(error);
  }
  refresh();
  if (result.outcome === 'failed')
    return {
      status: 'error',
      message: 'Most sem sikerült feldolgozni. A hibaüzenetet az esemény technikai részletei között találod.',
    };
  return success(
    result.outcome === 'stale'
      ? 'Az eseményt feldolgoztuk, de ennél frissebb adatunk van a munkavállalóról, ezért nem változott semmi.'
      : 'Az eseményt feldolgoztuk.',
  );
}
