import {
  SkeletonButton,
  SkeletonMeta,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonRowAction,
  SkeletonStatus,
  SkeletonTable,
  SkeletonText,
} from '@/components/page-skeleton';
import { TwoLine } from '@/components/table-card';

const orders = [
  ['IDE Pro', 'Csapat', 'Kézzel kiadott kulcs', '150 000 Ft'],
  ['Office Suite', 'Alap', 'Másik Zrt.', '90 000 Ft'],
  ['IDE Pro', 'Részleg', 'Példa Kft.', '540 000 Ft'],
];

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        title="Rendelések"
        description="Minden vásárlás és kézzel kiadott licenckulcs, a legfrissebb elöl."
        actions={<SkeletonButton>Kulcs kiadása</SkeletonButton>}
      />
      <SkeletonTable
        rows={orders.length}
        header="max-lg:hidden"
        columns={[
          {
            head: 'w-full lg:w-48 xl:w-52 min-[87.5rem]:w-56',
            label: 'Termék és csomag',
            cell: 'max-lg:whitespace-normal',
            content: row => (
              <>
                <TwoLine
                  title={
                    <span className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate">
                        <SkeletonText>{orders[row][0]}</SkeletonText>
                      </span>
                      <span className="shrink-0 font-normal lg:hidden">
                        <SkeletonStatus>Aktiválva</SkeletonStatus>
                      </span>
                    </span>
                  }
                  sub={
                    <>
                      <span className="block truncate max-lg:hidden">
                        <SkeletonText>{orders[row][1]}</SkeletonText>
                      </span>
                      <SkeletonMeta
                        className="lg:hidden"
                        items={[orders[row][1], orders[row][2], orders[row][3], '2026. jan. 10.']}
                      />
                    </>
                  }
                />
                <SkeletonRowAction className="mt-1.5 mr-0 mb-0 -ml-2.5 lg:hidden">Visszavonás</SkeletonRowAction>
              </>
            ),
          },
          {
            head: 'lg:w-44',
            label: 'Cég',
            cell: 'hidden lg:table-cell',
            content: row => <SkeletonText>{orders[row][2]}</SkeletonText>,
          },
          {
            head: 'hidden xl:table-cell xl:w-44',
            label: 'Megrendelve',
            cell: 'hidden xl:table-cell',
            content: <SkeletonText>2026. jan. 10. 15:18</SkeletonText>,
          },
          {
            head: 'hidden min-[87.5rem]:table-cell min-[87.5rem]:w-24',
            label: 'Kulcs',
            cell: 'hidden min-[87.5rem]:table-cell',
            content: <SkeletonText>…RYSW</SkeletonText>,
          },
          {
            head: 'lg:w-32',
            label: 'Állapot',
            cell: 'max-lg:hidden',
            content: <SkeletonStatus>Aktiválva</SkeletonStatus>,
          },
          {
            head: 'hidden text-right xl:table-cell xl:w-32',
            label: 'Ár',
            cell: 'hidden text-right xl:table-cell',
            content: row => <SkeletonText>{orders[row][3]}</SkeletonText>,
          },
          {
            head: 'w-px md:w-auto',
            cell: 'text-right max-lg:hidden',
            content: <SkeletonRowAction>Visszavonás</SkeletonRowAction>,
          },
        ]}
      />
    </SkeletonPage>
  );
}
