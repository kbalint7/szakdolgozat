'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-7xl flex-col items-center justify-center gap-4 px-4 py-8 text-center">
      <h1 className="text-2xl font-semibold">Hiba történt</h1>
      <p className="text-muted-foreground">Valami hiba történt az oldal betöltése közben.</p>
      <Button onClick={() => reset()}>Újrapróbálás</Button>
    </main>
  );
}
