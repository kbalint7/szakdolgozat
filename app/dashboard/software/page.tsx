import { AppWindowIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { Callout } from '@/components/callout';
import { EmptyState } from '@/components/empty-state';
import { MetaLine } from '@/components/meta-line';
import { PageHeader } from '@/components/page-header';
import { noSoftware, SoftwareStatus, softwareValidity } from '@/components/software-status';
import { Narrow } from '@/components/split-layout';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requireUser } from '@/lib/auth/session';
import { can } from '@/lib/domain/permissions';
import { listMyCompanies } from '@/lib/services/companies';
import { getMySoftware } from '@/lib/services/license-check';

export const metadata: Metadata = { title: 'Szoftvereim' };

export default async function MySoftwarePage() {
  const user = await requireUser();
  const [{ rows, unlinkedCompanies }, companies] = await Promise.all([
    getMySoftware(user.id),
    listMyCompanies(user.id),
  ]);
  const managed = new Set(
    companies.filter(company => can(company.role, 'employees.manage')).map(company => company.id),
  );
  const unlinkedNames = unlinkedCompanies.filter(company => !managed.has(company.id)).map(company => company.name);
  const unlinked = unlinkedNames.join(', ');
  const severalUnlinked = unlinkedNames.length > 1;

  return (
    <>
      <PageHeader
        title="Szoftvereim"
        description="Melyik szoftvert melyik cégtől kaptad, és hol tartasz a várólistán."
      />

      <Narrow>
        {rows.length === 0 ? (
          <EmptyState icon={<AppWindowIcon />} title={noSoftware.title} description={noSoftware.description} />
        ) : (
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-full md:w-60 lg:w-44">Szoftver</TableHead>
                  <TableHead className="hidden lg:table-cell lg:w-40">Cég</TableHead>
                  <TableHead className="hidden lg:table-cell lg:w-40">Érvényes</TableHead>
                  <TableHead>Állapot</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(row => {
                  const validity = softwareValidity(row);
                  return (
                    <TableRow key={`${row.companyId}-${row.productId}`}>
                      <TableCell className="max-lg:whitespace-normal">
                        <div className="truncate leading-5 font-medium">{row.productName}</div>
                        <MetaLine className="lg:hidden" items={[row.companyName, validity]} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="block truncate">{row.companyName}</span>
                      </TableCell>
                      <TableCell className="nums hidden text-muted-foreground lg:table-cell">{validity}</TableCell>
                      <TableCell>
                        <SoftwareStatus row={row} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableCard>
        )}

        {unlinked && (
          <Callout
            tone="warning"
            title={
              severalUnlinked
                ? `Nincs összekapcsolva a fiókod ezeknél a cégeknél: ${unlinked}`
                : `Nincs összekapcsolva a fiókod ennél a cégnél: ${unlinked}`
            }
          >
            {severalUnlinked
              ? 'Amíg ez így van, nem tudod használni a szoftvereiket. Ha a munkavállalójuk vagy, kérd meg az adminisztrátoraikat, hogy kapcsolják össze a fiókodat a munkavállalói adataiddal.'
              : 'Amíg ez így van, nem tudod használni a cég szoftvereit. Ha a cég munkavállalója vagy, kérd meg az adminisztrátorát, hogy kapcsolja össze a fiókodat a munkavállalói adataiddal.'}
          </Callout>
        )}
      </Narrow>
    </>
  );
}
