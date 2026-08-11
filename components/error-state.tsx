'use client';

import { TriangleAlertIcon } from 'lucide-react';
import { useEffect } from 'react';

import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';

export function ErrorState({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={<TriangleAlertIcon />}
      title="Hiba történt"
      description={
        <>
          Az oldal betöltése nem sikerült. Próbáld újra, és ha a hiba megmarad, jelezd az üzemeltetőnek.
          {error.digest && <span className="mt-2 block font-mono text-xs">Hibakód: {error.digest}</span>}
        </>
      }
      action={<Button onClick={() => retry()}>Újrapróbálás</Button>}
    />
  );
}
