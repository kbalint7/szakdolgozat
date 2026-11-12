import { cn } from 'cn';
import { BuildingIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { EmptyState } from '@/components/empty-state';
import { MetaLine } from '@/components/meta-line';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { TableCard, TwoLine } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requirePlatformAdmin } from '@/lib/auth/session';
import { formatDate, formatNumber } from '@/lib/format';
import { listAllCompanies } from '@/lib/services/companies';

export const metadata: Metadata = { title: 'Cégek' };

function Count({ value, className }: { value: number; className?: string }) {
  return (
    <TableCell className={cn('nums text-right', value === 0 && 'text-muted-foreground', className)}>
      {formatNumber(value)}
    </TableCell>
  );
}

export default async function AdminCompaniesPage() {
  await requirePlatformAdmin();
  const companies = await listAllCompanies();

  return (
    <>
      <PageHeader
        title="Cégek"
        description="A cégek adatait a saját adminisztrátoraik kezelik. Itt csak megnézheted a cégeket."
      />
      {companies.length === 0 ? (
        <EmptyState
          icon={<BuildingIcon />}
          title="Még nincs cég"
          description="A cégeket a felhasználók hozzák létre a saját vezérlőpultjukon."
        />
      ) : (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-full md:w-auto lg:w-56 min-[87.5rem]:w-72">Cég</TableHead>
                <TableHead className="hidden lg:table-cell xl:w-52 min-[87.5rem]:w-56">Tulajdonos</TableHead>
                <TableHead className="hidden xl:table-cell">Létrehozva</TableHead>
                <TableHead className="hidden text-right lg:table-cell lg:w-20">Tagok</TableHead>
                <TableHead className="hidden text-right xl:table-cell xl:w-40">Aktív munkavállalók</TableHead>
                <TableHead className="text-right md:w-32">
                  <span className="max-md:hidden">Érvényes licencek</span>
                  <span className="md:hidden">Licencek</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map(company => (
                <TableRow key={company.id}>
                  <TableCell className="max-lg:whitespace-normal">
                    <div className="truncate leading-5 font-medium">{company.name}</div>
                    {company.deletedAt && (
                      <StatusBadge tone="danger" className="nums block text-[13px] leading-4.5">
                        Törölve: {formatDate(company.deletedAt)}
                      </StatusBadge>
                    )}
                    <MetaLine
                      className="lg:hidden"
                      items={[
                        company.ownerName,
                        `${formatNumber(company.members)} tag`,
                        `${formatNumber(company.employees)} munkavállaló`,
                      ]}
                    />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {company.ownerName ? (
                      <TwoLine
                        title={<span className="block truncate font-normal">{company.ownerName}</span>}
                        sub={<span className="block truncate">{company.ownerEmail}</span>}
                      />
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </TableCell>
                  <TableCell className="nums hidden text-muted-foreground xl:table-cell">
                    {formatDate(company.createdAt)}
                  </TableCell>
                  <Count value={company.members} className="hidden lg:table-cell" />
                  <Count value={company.employees} className="hidden xl:table-cell" />
                  <Count value={company.licenses} />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </>
  );
}
