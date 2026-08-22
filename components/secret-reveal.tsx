'use client';

import { CheckIcon, CopyIcon, KeyRoundIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function SecretReveal({ label, value, note }: { label: string; value: string; note?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div role="alert" className="flex flex-col gap-3 rounded-xl border border-success/40 bg-success/5 p-4 text-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success/15 text-success">
          <KeyRoundIcon className="size-4" />
        </span>
        <div className="min-w-0 space-y-0.5">
          <div className="font-medium">{label}</div>
          <p className="text-pretty text-muted-foreground">
            {note ?? 'Csak most látod: később nem tudjuk újra megmutatni, ezért mentsd el.'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 rounded-lg bg-card px-3 py-2 font-mono text-sm break-all ring-1 ring-foreground/8">
          {value}
        </code>
        <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Másolás vágólapra">
          {copied ? <CheckIcon className="text-success" /> : <CopyIcon />}
        </Button>
      </div>
    </div>
  );
}
