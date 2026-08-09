import { KeyRoundIcon } from 'lucide-react';
import Link from 'next/link';

export function Logo({ href = '/', compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      aria-label="Licenckezelő"
    >
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
        <KeyRoundIcon className="size-4" />
      </span>
      <span className={compact ? 'hidden sm:inline' : undefined}>Licenckezelő</span>
    </Link>
  );
}
