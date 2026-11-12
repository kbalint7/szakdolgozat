import { cn } from 'cn';
import { SearchXIcon, UsersIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AccessDenied } from '@/components/access-denied';
import { ChipLink, ChipRow } from '@/components/chip-link';
import { Ident } from '@/components/code';
import { EmptyState } from '@/components/empty-state';
import { FilterBar, FilterReset, FilterSearch } from '@/components/filter-bar';
import { MetaLine } from '@/components/meta-line';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { ActionHead, ChevronCell, LoadMore, TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCompanyContext } from '@/lib/auth/company';
import { employeeStatusLabels } from '@/lib/i18n/labels';
import { countEmployeesByStatus, listEmployees } from '@/lib/services/employees';
import { listKnownJobRoles } from '@/lib/services/rules';
import { employeeFilterSchema } from '@/lib/validation/hr';

import { moreHref, parseListLimit } from '../../list-limit';
import { AccountMark } from '../account-mark';
import { ManualEventDialog } from '../manual-event-dialog';

export const metadata: Metadata = { title: 'Munkavállalók' };

const statuses = ['active', 'terminated'] as const;

export default async function EmployeesPage({
  params,
  searchParams,
}: PageProps<'/dashboard/companies/[companyId]/employees'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);
  if (!ctx.can('employees.view')) return <AccessDenied />;

  const query = await searchParams;
  const filter = employeeFilterSchema.parse(query);
  const limit = parseListLimit(query.limit);
  const [rows, counts, jobRoles] = await Promise.all([
    listEmployees(companyId, { search: filter.q, status: filter.status, limit }),
    countEmployeesByStatus(companyId, filter.q),
    listKnownJobRoles(companyId),
  ]);
  const base = `/dashboard/companies/${companyId}`;
  const list = `${base}/employees`;
  const filtered = Boolean(filter.q || filter.status);
  const total = counts.active + counts.terminated;
  const matching = filter.status ? counts[filter.status] : total;

  function tabHref(status?: (typeof statuses)[number]) {
    const query = new URLSearchParams();
    if (filter.q) query.set('q', filter.q);
    if (status) query.set('status', status);
    return query.size > 0 ? `${list}?${query}` : list;
  }

  return (
    <>
      <PageHeader
        trail={[{ href: base, label: ctx.company.name }]}
        trailMobileOnly
        title="Munkavállalók"
        description="A HR-rendszerből átvett munkavállalók és a szoftvereik."
        actions={ctx.can('employees.manage') && <ManualEventDialog companyId={companyId} jobRoles={jobRoles} />}
      />

      {total === 0 && !filtered ? (
        <EmptyState
          icon={<UsersIcon />}
          title="Még nincs munkavállaló"
          description="A munkavállalókat a HR-rendszer küldi át, vagy kézzel is rögzítheted őket."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <FilterBar keep={{ status: filter.status }}>
            <FilterSearch defaultValue={filter.q} placeholder="Név, HR-azonosító vagy munkakör" />
            <ChipRow label="Állapot">
              <ChipLink href={tabHref()} active={!filter.status} count={total}>
                Mind
              </ChipLink>
              {statuses.map(status => (
                <ChipLink key={status} href={tabHref(status)} active={filter.status === status} count={counts[status]}>
                  {employeeStatusLabels[status]}
                </ChipLink>
              ))}
            </ChipRow>
            {filtered && <FilterReset href={list} />}
          </FilterBar>

          {rows.length === 0 ? (
            <EmptyState
              compact
              icon={<SearchXIcon />}
              title="Nincs találat"
              description="Módosítsd a keresést vagy az állapotszűrőt."
            />
          ) : (
            <TableCard
              footer={
                rows.length < matching && (
                  <LoadMore
                    href={moreHref(list, { q: filter.q, status: filter.status }, limit)}
                    shown={rows.length}
                    total={matching}
                  />
                )
              }
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-full md:w-60 lg:w-80 xl:w-96">Munkavállaló</TableHead>
                    <TableHead className="hidden lg:table-cell lg:w-40 xl:w-60">Munkakör</TableHead>
                    <TableHead className="md:w-40 lg:w-44 xl:w-72">Szoftverek</TableHead>
                    <ActionHead label="Megnyitás" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(employee => {
                    const active = employee.status === 'active';
                    return (
                      <TableRow key={employee.id} className={cn('relative', !active && 'text-muted-foreground')}>
                        <TableCell>
                          <span className="flex min-w-0 items-baseline gap-2.5">
                            <Link
                              href={`${list}/${employee.id}`}
                              className={cn(
                                'min-w-0 truncate font-medium outline-none after:absolute after:inset-0 focus-visible:after:rounded-sm focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset',
                                (!active || !employee.name) && 'font-normal text-muted-foreground',
                              )}
                            >
                              {employee.name ?? 'Név nélkül'}
                            </Link>
                            <Ident className="max-lg:hidden">{employee.hrId}</Ident>
                            {employee.linkedUser && (
                              <AccountMark
                                className="relative z-10"
                                title={`Összekapcsolt fiók: ${employee.linkedUser.name} (${employee.linkedUser.email})`}
                              />
                            )}
                            {!active && (
                              <StatusBadge tone="neutral" className="shrink-0 text-[13px]">
                                {employeeStatusLabels[employee.status]}
                              </StatusBadge>
                            )}
                          </span>
                          <MetaLine className="leading-4 lg:hidden" items={[employee.hrId, employee.jobRole]} />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="block truncate" title={employee.jobRole || undefined}>
                            {employee.jobRole}
                          </span>
                        </TableCell>
                        <TableCell className="max-xl:whitespace-normal">
                          <div className="flex flex-col gap-0.5">
                            {employee.seats.length === 0 && <span className="text-muted-foreground">–</span>}
                            {employee.seats.map(seat => (
                              <span
                                key={seat.productId}
                                className="flex min-w-0 items-baseline gap-x-2.5 max-xl:flex-wrap"
                              >
                                <span className="min-w-0 truncate">{seat.productName}</span>
                                {seat.status === 'waiting' && (
                                  <StatusBadge tone="warning" className="shrink-0 text-[13px]">
                                    {seat.position}. a várólistán
                                  </StatusBadge>
                                )}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <ChevronCell />
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableCard>
          )}
        </div>
      )}
    </>
  );
}
