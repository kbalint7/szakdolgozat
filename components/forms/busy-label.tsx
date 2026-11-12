import { cn } from 'cn';

import { Spinner } from '@/components/ui/spinner';

export function BusyLabel({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <span className="relative inline-flex items-center justify-center gap-[inherit]">
      <span className={cn('inline-flex items-center gap-[inherit] transition-opacity', busy && 'opacity-0 delay-150')}>
        {children}
      </span>
      <Spinner
        aria-hidden={!busy}
        className={cn('absolute transition-opacity', busy ? 'opacity-100 delay-150' : 'animate-none opacity-0')}
      />
    </span>
  );
}
