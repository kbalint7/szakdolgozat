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
    <div role="alert" className="flex flex-col gap-3 rounded-xl bg-success/6 p-4 text-sm ring-1 ring-success/25">
      <div className="flex gap-3">
        <KeyRoundIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
        <div className="min-w-0 space-y-0.5">
          <div className="font-medium">{label}</div>
          <p className="text-pretty text-muted-foreground">
            {note ?? 'Mentsd el most, mert később nem tudjuk újra megmutatni.'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 rounded-lg bg-card px-3 py-2 font-mono text-[13px] break-all ring-1 ring-border">
          {value}
        </code>
        <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Másolás vágólapra">
          {copied ? <CheckIcon className="text-success" /> : <CopyIcon />}
        </Button>
      </div>
    </div>
  );
}
