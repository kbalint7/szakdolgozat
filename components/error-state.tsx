'use client';

import { useEffect } from 'react';

import { Message } from '@/components/message-screen';
import { Button } from '@/components/ui/button';

export function ErrorState({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Message
      eyebrow={error.digest ? <>Hibakód: {error.digest}</> : undefined}
      title="Hiba történt"
      description="Az oldalt nem sikerült betölteni. Próbáld újra, és ha akkor sem megy, szólj az üzemeltetőnek."
      action={<Button onClick={() => retry()}>Újrapróbálás</Button>}
    />
  );
}
