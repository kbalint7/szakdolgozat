'use client';

import { cn } from 'cn';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

export function ChipLink({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  const empty = count === 0 && !active;
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-foreground/15 bg-card font-medium text-foreground shadow-card max-md:[scroll-initial-target:nearest]'
          : 'border-transparent hover:bg-muted hover:text-foreground',
        !active && (empty ? 'text-muted-foreground/60' : 'text-muted-foreground'),
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn('nums text-xs font-normal', active ? 'text-muted-foreground' : 'opacity-80')}>{count}</span>
      )}
    </Link>
  );
}

export function ChipDivider() {
  return <span aria-hidden className="mx-1.5 h-4 w-px shrink-0 self-center bg-border" />;
}

export function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  const row = useRef<HTMLElement>(null);
  const shown = useRef<number | null>(null);

  useEffect(() => {
    const strip = row.current;
    if (!strip) return;
    const current = strip.querySelector<HTMLElement>('[aria-current="page"]');
    const index = current ? Array.prototype.indexOf.call(strip.children, current) : -1;
    const first = shown.current === null;
    if (index === shown.current) return;
    shown.current = index;
    if (!current || strip.scrollWidth <= strip.clientWidth) return;
    const left = Math.max(0, current.offsetLeft - strip.offsetLeft - 16);
    const glide = !first && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    strip.scrollTo({ left, behavior: glide ? 'smooth' : 'instant' });
  });

  useEffect(() => {
    const strip = row.current;
    if (!strip || CSS.supports('animation-timeline: scroll()')) return;
    const update = () => strip.style.setProperty('--chip-fade-start', `${Math.min(strip.scrollLeft, 40)}px`);
    update();
    strip.addEventListener('scroll', update, { passive: true });
    return () => strip.removeEventListener('scroll', update);
  }, []);

  return (
    <nav
      ref={row}
      data-slot="chip-row"
      className="flex [scrollbar-width:none] gap-1 max-md:-mx-4 max-md:-my-1 max-md:scroll-pl-4 max-md:overflow-x-auto max-md:py-1 max-md:pr-12 max-md:pl-4 md:flex-wrap [&::-webkit-scrollbar]:hidden"
      aria-label={label}
    >
      {children}
    </nav>
  );
}
