import {
  AppWindowIcon,
  ArrowRightIcon,
  BuildingIcon,
  ChevronRightIcon,
  HourglassIcon,
  ShieldCheckIcon,
  UsersIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Callout } from '@/components/callout';
import { EmptyState } from '@/components/empty-state';
import { LinkButton } from '@/components/link-button';
import { PageHeader } from '@/components/page-header';
import { Section } from '@/components/section';
import { SoftwareStatus } from '@/components/software-status';
import { StatCard, StatGrid } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { requireUser } from '@/lib/auth/session';
import { can, roleLabels } from '@/lib/domain/permissions';
import { formatDate } from '@/lib/format';
import { listMyCompanies } from '@/lib/services/companies';
import { getMySoftware } from '@/lib/services/license-check';

export const metadata: Metadata = { title: 'Vezérlőpult' };

export default async function DashboardPage() {
  const user = await requireUser();
  const [companies, software] = await Promise.all([listMyCompanies(user.id), getMySoftware(user.id)]);
  const allowed = software.rows.filter(row => row.status === 'allowed').length;
  const waiting = software.rows.filter(row => row.status === 'waiting').length;
  const managed = companies.filter(company => can(company.role, 'licenses.view')).length;

  return (
    <>
      <PageHeader
        eyebrow="Vezérlőpult"
        title={`Üdv, ${user.name}!`}
        description="Itt találod a cégeidet és a hozzáféréseidet."
      />

      <StatGrid>
        <StatCard label="Cégeim" value={companies.length} icon={<BuildingIcon />} tone="primary" />
        <StatCard
          label="Kezelt cégek"
          value={managed}
          hint="tulajdonosként vagy adminisztrátorként"
          icon={<UsersIcon />}
        />
        <StatCard label="Használható szoftverek" value={allowed} icon={<ShieldCheckIcon />} tone="success" />
        <StatCard
          label="Várólistán"
          value={waiting}
          icon={<HourglassIcon />}
          tone={waiting > 0 ? 'warning' : 'default'}
        />
      </StatGrid>

      {companies.length === 0 && (
        <Callout tone="note" title="Első lépések">
          Hozz létre egy céget, válassz egy csomagot a termékek közül, majd add meg, melyik munkakörnek melyik szoftver
          jár. Amint a munkatársaid bekerülnek a rendszerbe, automatikusan helyet kapnak.
        </Callout>
      )}

      <Section
        title="Hozzáféréseim"
        description="Melyik szoftvert melyik cégen keresztül használhatod."
        actions={
          <LinkButton href="/dashboard/software" variant="ghost">
            Részletek <ArrowRightIcon data-icon="inline-end" />
          </LinkButton>
        }
      >
        {software.rows.length === 0 ? (
          <EmptyState
            compact
            icon={<AppWindowIcon />}
            title="Még nincs használható szoftvered"
            description="Helyet akkor kapsz, ha a céged munkavállalóként tart nyilván, és a munkakörödhöz tartozik szoftver."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {software.rows.map(row => (
              <li
                key={`${row.companyId}-${row.productId}`}
                className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-card ring-1 ring-foreground/8"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{row.productName}</div>
                    <div className="truncate text-sm text-muted-foreground">{row.companyName}</div>
                  </div>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <AppWindowIcon className="size-4" />
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <SoftwareStatus row={row} />
                  <span>{row.validUntil ? `${formatDate(row.validUntil)}-ig` : 'határozatlan ideig'}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Cégeim"
        description="A cégek, amelyeknek tagja vagy."
        actions={
          <LinkButton href="/dashboard/companies/new" variant="outline">
            Új cég
          </LinkButton>
        }
      >
        {companies.length === 0 ? (
          <EmptyState
            icon={<BuildingIcon />}
            title="Még egy cégnek sem vagy tagja"
            description="Hozd létre a céged, vagy kérd meg a céged adminisztrátorát, hogy hívjon meg."
            action={<LinkButton href="/dashboard/companies/new">Cég létrehozása</LinkButton>}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {companies.map(company => (
              <li key={company.id}>
                <Link
                  href={`/dashboard/companies/${company.id}`}
                  className="group flex h-full flex-col gap-4 rounded-xl bg-card p-5 shadow-card ring-1 ring-foreground/8 transition-all outline-none hover:shadow-md hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <BuildingIcon className="size-5" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <div className="font-semibold tracking-tight">{company.name}</div>
                      {company.description && (
                        <p className="line-clamp-2 text-sm text-pretty text-muted-foreground">{company.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Badge variant={company.role === 'member' ? 'secondary' : 'default'}>
                        {roleLabels[company.role]}
                      </Badge>
                      <span className="nums">{company.memberCount} tag</span>
                    </span>
                    <ChevronRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
