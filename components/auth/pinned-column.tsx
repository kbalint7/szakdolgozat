'use client';

import { cn } from 'cn';
import { useCallback } from 'react';

export function PinnedColumn({ className, ...props }: React.ComponentProps<'div'>) {
  const pin = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    node.style.setProperty('--pinned-height', `${node.offsetHeight}px`);
    node.dataset.pinned = '';
  }, []);
  return (
    <div
      ref={pin}
      className={cn(
        'sm:data-pinned:mt-[max(0px,calc((100vh-5rem-16vh-var(--pinned-height))/2))] sm:data-pinned:mb-auto',
        className,
      )}
      {...props}
    />
  );
}
