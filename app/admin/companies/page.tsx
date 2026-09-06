import { BuildingIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requirePlatformAdmin } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { listAllCompanies } from '@/lib/services/companies';

export const metadata: Metadata = { title: 'Cégek' };

export default async function AdminCompaniesPage() {
  await requirePlatformAdmin();
  const companies = await listAllCompanies();

  return (
    <>
      <PageHeader
        eyebrow="Platform admin"
        title="Cégek"
        description="Csak olvasható áttekintés: a cégek adatait a saját adminisztrátoraik kezelik."
      />
      {companies.length === 0 ? (
        <EmptyState icon={<BuildingIcon />} title="Még nincs cég" />
      ) : (
        <TableCard footer={<span className="nums text-muted-foreground">{companies.length} cég</span>}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Név</TableHead>
                <TableHead>Tulajdonos</TableHead>
                <TableHead className="text-right">Tagok</TableHead>
                <TableHead className="text-right">Aktív munkavállalók</TableHead>
                <TableHead className="text-right">Aktív licencek</TableHead>
                <TableHead>Létrehozva</TableHead>
                <TableHead>Állapot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map(company => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>
                    {company.ownerName ?? '–'}
                    {company.ownerEmail && <div className="text-xs text-muted-foreground">{company.ownerEmail}</div>}
                  </TableCell>
                  <TableCell className="nums text-right">{company.members}</TableCell>
                  <TableCell className="nums text-right">{company.employees}</TableCell>
                  <TableCell className="nums text-right">{company.licenses}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(company.createdAt)}</TableCell>
                  <TableCell>
                    {company.deletedAt ? (
                      <StatusBadge tone="danger">Törölve: {formatDate(company.deletedAt)}</StatusBadge>
                    ) : (
                      <StatusBadge tone="success">Aktív</StatusBadge>
                    )}
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
