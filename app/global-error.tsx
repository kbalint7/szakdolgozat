'use client';

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  console.error(error);

  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <main className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col items-center justify-center gap-4 px-4 py-8 text-center">
          <h1 className="text-2xl font-semibold">Súlyos hiba történt</h1>
          <p className="text-muted-foreground">Az alkalmazás nem tudta betölteni az oldalt.</p>
          <button
            onClick={() => reset()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors">
            Újrapróbálás
          </button>
        </main>
      </body>
    </html>
  );
}
