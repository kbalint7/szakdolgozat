import { SearchIcon, UsersIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AccessDenied } from '@/components/access-denied';
import { Mono } from '@/components/code';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { TableCard } from '@/components/table-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCompanyContext } from '@/lib/auth/company';
import { employeeStatusLabels } from '@/lib/i18n/labels';
import { listEmployees } from '@/lib/services/employees';
import { listKnownJobRoles } from '@/lib/services/rules';
import { employeeFilterSchema } from '@/lib/validation/hr';

import { ManualEventDialog } from './manual-event-dialog';

export const metadata: Metadata = { title: 'Munkavállalók' };

export default async function EmployeesPage({
  params,
  searchParams,
}: PageProps<'/dashboard/companies/[companyId]/employees'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);
  if (!ctx.can('employees.view')) return <AccessDenied />;

  const filter = employeeFilterSchema.parse(await searchParams);
  const [rows, jobRoles] = await Promise.all([
    listEmployees(companyId, { search: filter.q, status: filter.status }),
    listKnownJobRoles(companyId),
  ]);
  const filtered = Boolean(filter.q || filter.status);
  const base = `/dashboard/companies/${companyId}`;

  return (
    <>
      <PageHeader
        eyebrow={ctx.company.name}
        title="Munkavállalók"
        description="A cég munkavállalói, a szoftvereik és a várólista-helyük."
        actions={ctx.can('employees.manage') && <ManualEventDialog companyId={companyId} jobRoles={jobRoles} />}
      />

      <form
        className="flex flex-col gap-2 rounded-xl bg-card p-2 shadow-card ring-1 ring-foreground/8 sm:flex-row sm:items-center"
        role="search"
      >
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={filter.q}
            placeholder="Keresés HR-azonosítóra, névre, e-mailre vagy munkakörre"
            aria-label="Keresés"
            className="pl-8"
          />
        </div>
        <NativeSelect name="status" defaultValue={filter.status ?? ''} aria-label="Állapot" className="sm:w-44">
          <NativeSelectOption value="">Minden állapot</NativeSelectOption>
          <NativeSelectOption value="active">Aktív</NativeSelectOption>
          <NativeSelectOption value="terminated">Kilépett</NativeSelectOption>
        </NativeSelect>
        <Button type="submit" variant="secondary">
          Szűrés
        </Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={<UsersIcon />}
          title={filtered ? 'Nincs találat' : 'Még nincs munkavállaló'}
          description={
            filtered
              ? 'Módosítsd a keresést vagy a szűrőt.'
              : 'A munkavállalókat a HR-rendszer küldi át, vagy kézzel is rögzítheted őket.'
          }
        />
      ) : (
        <TableCard
          footer={
            <span className="nums text-muted-foreground">
              {rows.length} munkavállaló{filtered ? ' a szűrés szerint' : ''}
            </span>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>HR-azonosító</TableHead>
                <TableHead>Név</TableHead>
                <TableHead>Munkakör</TableHead>
                <TableHead>Állapot</TableHead>
                <TableHead>Fiók</TableHead>
                <TableHead>Helyek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(employee => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Link href={`${base}/employees/${employee.id}`} className="hover:underline">
                      <Mono>{employee.hrId}</Mono>
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`${base}/employees/${employee.id}`} className="hover:underline">
                      {employee.name ?? '–'}
                    </Link>
                  </TableCell>
                  <TableCell>{employee.jobRole ? <Mono>{employee.jobRole}</Mono> : '–'}</TableCell>
                  <TableCell>
                    <StatusBadge tone={employee.status === 'active' ? 'success' : 'neutral'}>
                      {employeeStatusLabels[employee.status]}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{employee.linkedUser?.email ?? '–'}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {employee.seats.length === 0 && <span className="text-muted-foreground">–</span>}
                      {employee.seats.map(seat =>
                        seat.status === 'assigned' ? (
                          <StatusBadge key={seat.productId} tone="success" dot={false}>
                            {seat.productName}
                          </StatusBadge>
                        ) : (
                          <StatusBadge key={seat.productId} tone="warning" dot={false}>
                            {seat.productName} · {seat.position}. a sorban
                          </StatusBadge>
                        ),
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </>
  );
}
