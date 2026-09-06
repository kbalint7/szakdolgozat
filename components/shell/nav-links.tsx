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
  children?: NavItem[];
};

export type NavSection = { title?: string; items: NavItem[] };

type NavLinksProps = { sections: NavSection[]; onNavigate?: () => void };

function isActive(pathname: string | null, item: NavItem) {
  if (!pathname) return false;
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function Item({ item, pathname, onNavigate }: { item: NavItem; pathname: string | null; onNavigate?: () => void }) {
  const active = isActive(pathname, item);
  return (
    <>
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:shrink-0',
          active
            ? 'bg-primary/10 font-medium text-primary [&_svg]:text-primary'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground [&_svg]:text-muted-foreground',
        )}
      >
        {item.icon}
        <span className="truncate">{item.label}</span>
        {item.meta && <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{item.meta}</span>}
      </Link>
      {item.children && item.children.length > 0 && (
        <div className="my-0.5 ml-5 flex flex-col gap-0.5 border-l border-sidebar-border pl-2">
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
            <div className="px-3 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
              {section.title}
            </div>
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
