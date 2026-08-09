'use client';

import './globals.css';

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="hu">
      <body className="flex min-h-svh items-center justify-center p-4 font-sans">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-xl font-semibold">Váratlan hiba történt</h1>
          <p className="text-sm text-muted-foreground">
            Az alkalmazás nem tudta betölteni az oldalt.
            {error.digest && <span className="mt-2 block font-mono text-xs">Hibakód: {error.digest}</span>}
          </p>
          <button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => retry()}>
            Újrapróbálás
          </button>
        </div>
      </body>
    </html>
  );
}
