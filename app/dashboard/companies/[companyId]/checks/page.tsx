import { SearchXIcon, ShieldCheckIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { AccessDenied } from '@/components/access-denied';
import { ChipLink, ChipRow } from '@/components/chip-link';
import { EmptyState } from '@/components/empty-state';
import { FilterBar, FilterReset, FilterSearch } from '@/components/filter-bar';
import { MetaLine } from '@/components/meta-line';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { EmptyRow, LoadMore, TableCard, TwoLine } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCompanyContext } from '@/lib/auth/company';
import { formatDateTime } from '@/lib/format';
import { checkReasonLabels, label } from '@/lib/i18n/labels';
import { countChecksByResult, listRecentChecks } from '@/lib/services/license-check';

import { moreHref, parseListLimit, parseListSearch } from '../list-limit';

export const metadata: Metadata = { title: 'Ellenőrzések' };

const tabs = [
  { value: 'allowed', label: 'Engedélyezve' },
  { value: 'denied', label: 'Elutasítva' },
] as const;

export default async function ChecksPage({
  params,
  searchParams,
}: PageProps<'/dashboard/companies/[companyId]/checks'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);
  if (!ctx.can('checks.view')) return <AccessDenied />;

  const query = await searchParams;
  const tab = tabs.find(item => item.value === query.result)?.value;
  const search = parseListSearch(query.q);
  const limit = parseListLimit(query.limit);
  const [checks, counts] = await Promise.all([
    listRecentChecks(companyId, limit, tab ? tab === 'allowed' : undefined, search),
    countChecksByResult(companyId, search),
  ]);
  const company = `/dashboard/companies/${companyId}`;
  const base = `${company}/checks`;
  const total = counts.allowed + counts.denied;
  const matching = tab ? counts[tab] : total;
  const filtered = Boolean(search || tab);

  function tabHref(result?: (typeof tabs)[number]['value']) {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (result) params.set('result', result);
    return params.size > 0 ? `${base}?${params}` : base;
  }

  return (
    <>
      <PageHeader
        trail={[{ href: company, label: ctx.company.name }]}
        trailMobileOnly
        title="Ellenőrzések"
        description="Ki mikor próbálta használni a cég szoftvereit, és mi lett az eredmény."
      />
      {total === 0 && !search ? (
        <EmptyState
          icon={<ShieldCheckIcon />}
          title="Még nem volt ellenőrzés"
          description="Itt jelenik meg, ha valaki megpróbálja használni a cég egyik szoftverét."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <FilterBar keep={{ result: tab }}>
            <FilterSearch defaultValue={search} placeholder="Név vagy e-mail-cím" />
            <ChipRow label="Eredmény">
              <ChipLink href={tabHref()} active={!tab} count={total}>
                Mind
              </ChipLink>
              {tabs.map(item => (
                <ChipLink
                  key={item.value}
                  href={tabHref(item.value)}
                  active={item.value === tab}
                  count={counts[item.value]}
                >
                  {item.label}
                </ChipLink>
              ))}
            </ChipRow>
            {filtered && <FilterReset href={base} />}
          </FilterBar>

          {checks.length === 0 && search ? (
            <EmptyState
              compact
              icon={<SearchXIcon />}
              title="Nincs találat"
              description="Módosítsd a keresést vagy az eredményszűrőt."
            />
          ) : (
            <TableCard
              footer={
                checks.length < matching && (
                  <LoadMore
                    href={moreHref(base, { q: search, result: tab }, limit)}
                    shown={checks.length}
                    total={matching}
                  />
                )
              }
            >
              {checks.length === 0 ? (
                <EmptyRow>Ilyen eredményű ellenőrzés még nem volt.</EmptyRow>
              ) : (
                <Table>
                  <TableHeader className="max-md:hidden">
                    <TableRow>
                      <TableHead className="hidden xl:table-cell xl:w-44">Időpont</TableHead>
                      <TableHead className="w-full max-xl:pl-5 md:w-72 xl:w-[22rem]">Felhasználó</TableHead>
                      <TableHead className="hidden xl:table-cell xl:w-48">Szoftver</TableHead>
                      <TableHead className="max-md:hidden">Eredmény</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checks.map(check => {
                      const product = check.productName ?? check.productSlug;
                      const reason = check.allowed ? null : label(checkReasonLabels, check.reason);
                      const time = formatDateTime(check.createdAt);
                      const user = check.userName ?? (
                        <span className="font-normal text-muted-foreground">Ismeretlen felhasználó</span>
                      );
                      return (
                        <TableRow key={check.id} className="relative">
                          <TableCell className="nums hidden text-muted-foreground xl:table-cell">{time}</TableCell>
                          <TableCell className="max-xl:pl-5 max-md:whitespace-normal">
                            <TwoLine
                              title={<span className="block truncate max-md:pr-32">{user}</span>}
                              sub={
                                <>
                                  <span className="block truncate max-xl:hidden">{check.userEmail}</span>
                                  <MetaLine className="xl:hidden" items={[product, time, reason]} />
                                </>
                              }
                            />
                          </TableCell>
                          <TableCell
                            className="hidden xl:table-cell"
                            title={check.productName ? check.productSlug : undefined}
                          >
                            <span className="block truncate">{product}</span>
                          </TableCell>
                          <TableCell className="max-md:absolute max-md:top-2.5 max-md:right-5 max-md:h-auto max-md:p-0 max-md:last:pr-0">
                            {check.allowed ? (
                              <StatusBadge tone="success">Engedélyezve</StatusBadge>
                            ) : (
                              <span className="flex min-w-0 items-baseline gap-x-2.5">
                                <StatusBadge tone="danger" className="shrink-0">
                                  Elutasítva
                                </StatusBadge>
                                <span
                                  className="hidden min-w-0 truncate text-muted-foreground xl:block"
                                  title={check.reason ?? undefined}
                                >
                                  {reason}
                                </span>
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TableCard>
          )}
        </div>
      )}
    </>
  );
}
