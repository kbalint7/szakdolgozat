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
  if (result.outcome === 'failed') return { status: 'error', message: `Ismét sikertelen: ${result.error}` };
  return success(result.outcome === 'stale' ? 'Feldolgozva: az esemény elavult volt.' : 'Az esemény feldolgozva.');
}
