'use client';

import { cn } from 'cn';
import { MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SiteLink = { href: string; label: string };

function isCurrent(pathname: string | null, href: string) {
  if (!pathname || href.includes('#')) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function glideToAnchor(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
  const [path, id] = href.split('#');
  if (!id || window.location.pathname !== (path || '/')) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  if (window.location.hash !== `#${id}`) window.history.pushState(null, '', href);
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: still ? 'instant' : 'smooth', block: 'start' });
}

function Links({ links, pathname }: { links: SiteLink[]; pathname: string | null }) {
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Fő navigáció">
      {links.map(link => {
        const current = isCurrent(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={event => glideToAnchor(event, link.href)}
            aria-current={current ? 'page' : undefined}
            className={cn(
              'flex h-8 items-center rounded-lg px-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
              current
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted/50',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function CurrentLinks({ links }: { links: SiteLink[] }) {
  return <Links links={links} pathname={usePathname()} />;
}

export function SiteNav({ links }: { links: SiteLink[] }) {
  return (
    <Suspense fallback={<Links links={links} pathname={null} />}>
      <CurrentLinks links={links} />
    </Suspense>
  );
}

export function SiteMenu({ links }: { links: SiteLink[] }) {
  const pathname = usePathname();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Menü megnyitása" />}
      >
        <MenuIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {links.map(link => {
          const current = isCurrent(pathname, link.href);
          return (
            <DropdownMenuItem
              key={link.href}
              render={
                <Link
                  href={link.href}
                  onClick={event => glideToAnchor(event, link.href)}
                  aria-current={current ? 'page' : undefined}
                />
              }
              className={cn('px-2.5 py-2 text-[15px]', current && 'font-medium')}
            >
              {link.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
