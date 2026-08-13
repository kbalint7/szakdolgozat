'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import type { ActionState } from '@/lib/action-state';

export function useActionFeedback(state: ActionState, onSuccess?: (state: ActionState) => void) {
  const lastState = useRef(state);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  useEffect(() => {
    if (state === lastState.current) return;
    lastState.current = state;
    if (state.status === 'success') {
      if (state.message) toast.success(state.message);
      onSuccessRef.current?.(state);
    }
  }, [state]);
}
