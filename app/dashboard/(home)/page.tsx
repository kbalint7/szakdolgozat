import { BuildingIcon, ChevronRightIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { EmptyState } from '@/components/empty-state';
import { LinkButton } from '@/components/link-button';
import { MetaLine } from '@/components/meta-line';
import { PageHeader } from '@/components/page-header';
import { SeatMeter } from '@/components/seat-map';
import { Section } from '@/components/section';
import { noSoftware, SoftwareStatus, softwareValidity } from '@/components/software-status';
import { Narrow } from '@/components/split-layout';
import { EmptyRow, TableCard } from '@/components/table-card';
import { requireUser } from '@/lib/auth/session';
import { can, roleLabels } from '@/lib/domain/permissions';
import { listMyCompanies } from '@/lib/services/companies';
import { getMySoftware } from '@/lib/services/license-check';
import { getCompanyPools } from '@/lib/services/pool-queries';

export const metadata: Metadata = { title: 'Vezérlőpult' };

export default async function DashboardPage() {
  const user = await requireUser();
  const [companies, software] = await Promise.all([listMyCompanies(user.id), getMySoftware(user.id)]);
  const pools = new Map(
    await Promise.all(
      companies
        .filter(company => can(company.role, 'licenses.view'))
        .map(async company => [company.id, await getCompanyPools(company.id)] as const),
    ),
  );

  const companiesSection = (
    <Section title="Cégeim">
      {companies.length === 0 ? (
        <EmptyState
          icon={<BuildingIcon />}
          title="Még egy cégnek sem vagy tagja"
          description="Hozz létre egy céget, vagy kérj meghívót a céged adminisztrátorától."
          action={<LinkButton href="/dashboard/companies/new">Cég létrehozása</LinkButton>}
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {companies.map(company => {
            const companyPools = pools.get(company.id);
            return (
              <li key={company.id}>
                <Link
                  href={`/dashboard/companies/${company.id}`}
                  className="group block rounded-xl bg-card shadow-card ring-1 ring-border transition-shadow outline-none hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-center gap-3.5 p-5">
                    <span
                      aria-hidden
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-semibold text-primary"
                    >
                      {company.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold tracking-tight">{company.name}</div>
                      <MetaLine
                        className="leading-normal"
                        items={[roleLabels[company.role], `${company.memberCount} tag`]}
                      />
                    </div>
                    <ChevronRightIcon
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                    />
                  </div>
                  {companyPools && (
                    <div className="flex flex-col gap-3 border-t border-border/70 px-5 py-4 text-sm">
                      {companyPools.length === 0 && <p className="text-muted-foreground">Még nincs licenc.</p>}
                      {companyPools.map(pool => (
                        <div
                          key={pool.productId}
                          className="grid grid-cols-[minmax(0,1fr)] items-center gap-x-4 gap-y-1.5 sm:grid-cols-[8rem_minmax(0,1fr)]"
                        >
                          <span className="truncate">{pool.productName}</span>
                          <SeatMeter
                            assigned={pool.assigned}
                            capacity={pool.capacity}
                            waiting={pool.waiting}
                            label={pool.productName}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );

  const softwareSection = (
    <Section title="Szoftvereim">
      {software.rows.length === 0 ? (
        <TableCard>
          <EmptyRow>
            {noSoftware.title}. {noSoftware.description}
          </EmptyRow>
        </TableCard>
      ) : (
        <ul className="divide-y divide-border/70 overflow-hidden rounded-xl bg-card text-sm shadow-card ring-1 ring-border">
          {software.rows.map(row => (
            <li key={`${row.companyId}-${row.productId}`}>
              <Link
                href="/dashboard/software"
                className="group flex items-center gap-3 px-5 py-3 transition-colors outline-none hover:bg-muted/40 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset dark:hover:bg-muted/70"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate leading-5 font-medium">{row.productName}</span>
                    <SoftwareStatus row={row} />
                  </div>
                  <MetaLine items={[row.companyName, softwareValidity(row)]} />
                </div>
                <ChevronRightIcon
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );

  return (
    <>
      <PageHeader title={`Üdv, ${user.name}!`} />

      <Narrow>
        {software.rows.length > 0 ? softwareSection : companiesSection}
        {software.rows.length > 0 ? companiesSection : softwareSection}
      </Narrow>
    </>
  );
}
