import { AppWindowIcon } from 'lucide-react';
import type { Metadata } from 'next';

import { Callout } from '@/components/callout';

import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { SoftwareStatus } from '@/components/software-status';
import { TableCard } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { requireUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { getMySoftware } from '@/lib/services/license-check';

export const metadata: Metadata = { title: 'Szoftvereim' };

export default async function MySoftwarePage() {
  const user = await requireUser();
  const { rows, unlinkedCompanies } = await getMySoftware(user.id);

  return (
    <>
      <PageHeader
        eyebrow="Személyes"
        title="Szoftvereim"
        description="Melyik szoftvert melyik cégen keresztül használhatod, vagy hányadik vagy a várólistán."
      />

      {unlinkedCompanies.length > 0 && (
        <Callout tone="warning" title="Hiányzó összekapcsolás">
          A következő cégekben a fiókod még nincs összekapcsolva a munkavállalói adataiddal, ezért ott nem kaphatsz
          helyet: {unlinkedCompanies.map(company => company.name).join(', ')}. Kérd meg a cég adminisztrátorát.
        </Callout>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={<AppWindowIcon />}
          title="Még nincs szoftvered"
          description="Szoftvert akkor használhatsz, ha a céged a munkakörödhöz hozzárendelte. Ha szerinted jár neked, keresd a céged adminisztrátorát."
        />
      ) : (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Termék</TableHead>
                <TableHead>Cég</TableHead>
                <TableHead>Állapot</TableHead>
                <TableHead>Licenc érvényes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={`${row.companyId}-${row.productId}`}>
                  <TableCell>
                    <div className="font-medium">{row.productName}</div>
                    <div className="font-mono text-xs text-muted-foreground">{row.productSlug}</div>
                  </TableCell>
                  <TableCell>{row.companyName}</TableCell>
                  <TableCell>
                    <SoftwareStatus row={row} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.validUntil ? `${formatDate(row.validUntil)}-ig` : 'határozatlan ideig'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}

      <Callout tone="note" title="Hogyan működik a hozzáférés?">
        A szoftver használat közben a személyes tokeneddel ellenőrzi, hogy van-e érvényes helyed. Ha a helyedet
        visszavonják, a szoftver azonnal jelzi, hogy nincs hozzáférésed.
      </Callout>
    </>
  );
}
