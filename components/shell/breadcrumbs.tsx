'use client';

import { ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment, Suspense } from 'react';

const segmentLabels: Record<string, string> = {
  dashboard: 'Vezérlőpult',
  profile: 'Profil',
  purchase: 'Vásárlás',
  new: 'Új cég',
  members: 'Tagok és meghívók',
  employees: 'Munkavállalók',
  rules: 'Szabályok',
  licenses: 'Licencek és helyek',
  events: 'HR-események',
  audit: 'Audit napló',
  settings: 'Beállítások',
  admin: 'Platform admin',
  products: 'Termékek',
  orders: 'Rendelések',
};

const dynamicLabels: Record<string, string> = {
  employees: 'Munkavállaló',
  licenses: 'Helyek',
  products: 'Termék',
  purchase: 'Csomag',
};

type Crumb = { href: string; label: string };

function buildCrumbs(pathname: string, companyNames: Record<string, string>): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [];
  let href = '';
  for (const [index, segment] of segments.entries()) {
    href += `/${segment}`;
    const previous = segments[index - 1];
    if (segment === 'companies') continue;
    if (previous === 'companies') {
      crumbs.push({ href, label: companyNames[segment] ?? (segment === 'new' ? segmentLabels.new : 'Cég') });
    } else if (segmentLabels[segment]) {
      crumbs.push({ href, label: segmentLabels[segment] });
    } else if (previous && dynamicLabels[previous]) {
      crumbs.push({ href, label: dynamicLabels[previous] });
    }
  }
  return crumbs;
}

function Trail({ companyNames }: { companyNames: Record<string, string> }) {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname, companyNames);
  if (crumbs.length === 0) return null;
  return (
    <ol className="flex min-w-0 items-center gap-1 text-sm">
      {crumbs.map((crumb, index) => {
        const last = index === crumbs.length - 1;
        return (
          <Fragment key={crumb.href}>
            {index > 0 && <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />}
            <li className="min-w-0">
              {last ? (
                <span className="block truncate font-medium text-foreground" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="block truncate text-muted-foreground hover:text-foreground">
                  {crumb.label}
                </Link>
              )}
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}

export function Breadcrumbs({ companyNames = {} }: { companyNames?: Record<string, string> }) {
  return (
    <nav aria-label="Navigációs útvonal" className="min-w-0">
      <Suspense fallback={null}>
        <Trail companyNames={companyNames} />
      </Suspense>
    </nav>
  );
}
