'use client';

import { cn } from 'cn';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Suspense } from 'react';

export type NavItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
  exact?: boolean;
  meta?: string;
  quiet?: boolean;
  children?: NavItem[];
};

export type NavSection = { title?: string; items: NavItem[] };

type NavLinksProps = { sections: NavSection[]; onNavigate?: () => void };

function isActive(pathname: string | null, item: NavItem) {
  if (!pathname) return false;
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function Item({ item, pathname, onNavigate }: { item: NavItem; pathname: string | null; onNavigate?: () => void }) {
  const current = isActive(pathname, item);
  const active = current && !item.quiet;
  return (
    <>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={current ? 'page' : undefined}
        className={cn(
          'flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4 [&_svg]:shrink-0',
          active
            ? 'bg-card font-medium text-foreground shadow-card ring-1 ring-border dark:bg-sidebar-accent dark:ring-white/12 [&_svg]:text-primary'
            : cn(
                'hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                current
                  ? 'font-medium text-foreground [&_svg]:text-primary'
                  : 'text-sidebar-foreground/75 [&_svg]:text-muted-foreground/80',
              ),
        )}
      >
        {item.icon}
        <span className="truncate">{item.label}</span>
        {item.meta && <span className="ml-auto shrink-0 text-xs font-normal text-muted-foreground">{item.meta}</span>}
      </Link>
      {item.children && item.children.length > 0 && (
        <div className="my-1 ml-4.5 flex flex-col gap-0.5 border-l border-sidebar-border pl-2.5">
          {item.children.map(child => (
            <Item key={child.href} item={child} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </>
  );
}

function Links({ sections, onNavigate, pathname }: NavLinksProps & { pathname: string | null }) {
  return (
    <nav className="flex flex-col gap-6">
      {sections.map((section, index) => (
        <div key={section.title ?? index} className="flex flex-col gap-0.5">
          {section.title && (
            <div className="px-2.5 pb-1.5 text-xs font-medium text-muted-foreground/80">{section.title}</div>
          )}
          {section.items.map(item => (
            <Item key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
    </nav>
  );
}

function ActiveLinks(props: NavLinksProps) {
  return <Links {...props} pathname={usePathname()} />;
}

export function NavLinks(props: NavLinksProps) {
  return (
    <Suspense fallback={<Links {...props} pathname={null} />}>
      <ActiveLinks {...props} />
    </Suspense>
  );
}
