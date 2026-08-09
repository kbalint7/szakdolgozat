import { CircleAlertIcon, CircleCheckIcon } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

export function FormMessage({ status, message }: { status?: 'success' | 'error' | 'idle'; message?: string }) {
  if (!message || status === 'idle') return null;
  const isError = status === 'error';
  return (
    <Alert variant={isError ? 'destructive' : 'default'} aria-live="polite">
      {isError ? <CircleAlertIcon /> : <CircleCheckIcon />}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
