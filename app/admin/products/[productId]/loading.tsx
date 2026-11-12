import {
  SkeletonButton,
  SkeletonCallout,
  SkeletonCard,
  SkeletonMeta,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSection,
  SkeletonStatus,
  SkeletonTable,
  SkeletonText,
} from '@/components/page-skeleton';
import { SplitLayout } from '@/components/split-layout';

import { ProductFormSkeleton } from '../product-form-skeleton';

const plans = [
  ['Alap', '5 hely', '150 000 Ft'],
  ['Csapat', '10 hely', '290 000 Ft'],
  ['Részleg', '20 hely', '540 000 Ft'],
];

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        trail="‹ Termékek"
        title="IDE Pro"
        meta={
          <>
            <SkeletonStatus>Publikált</SkeletonStatus>
            <SkeletonButton size="sm">Elrejtés a katalógusból</SkeletonButton>
          </>
        }
      />

      <SkeletonSection title="Csomagok" count actions={<SkeletonButton size="sm">Új csomag</SkeletonButton>}>
        <SkeletonTable
          rows={plans.length}
          header="max-lg:hidden"
          columns={[
            {
              head: 'w-full lg:w-40 xl:w-60',
              label: 'Csomag',
              cell: 'max-lg:whitespace-normal',
              content: row => (
                <>
                  <div className="flex items-center justify-between gap-3 leading-5">
                    <span className="min-w-0 truncate font-medium">
                      <SkeletonText>{plans[row][0]}</SkeletonText>
                    </span>
                    <span className="shrink-0 lg:hidden">
                      <SkeletonStatus>Vásárolható</SkeletonStatus>
                    </span>
                  </div>
                  <SkeletonMeta className="lg:hidden" items={[plans[row][1], '1 év', plans[row][2]]} />
                </>
              ),
            },
            {
              head: 'lg:w-40',
              label: 'Időtartam',
              cell: 'hidden lg:table-cell',
              content: <SkeletonText>1 év</SkeletonText>,
            },
            {
              head: 'lg:w-32',
              label: 'Állapot',
              cell: 'max-lg:hidden',
              content: <SkeletonStatus>Vásárolható</SkeletonStatus>,
            },
            {
              head: 'text-right lg:w-20',
              label: 'Helyek',
              cell: 'hidden text-right lg:table-cell',
              content: <SkeletonText>20</SkeletonText>,
            },
            {
              head: 'pr-5 text-right lg:w-32',
              label: 'Ár',
              cell: 'hidden pr-5 text-right lg:table-cell',
              content: row => <SkeletonText>{plans[row][2]}</SkeletonText>,
            },
            {
              head: 'w-px md:w-auto',
              cell: 'w-px pl-0 text-right md:w-12 lg:w-auto',
              content: <span className="-my-1 -mr-2 inline-flex size-7 align-middle" />,
            },
          ]}
        />
      </SkeletonSection>

      <SplitLayout
        aside={
          <SkeletonCallout title="Mire hat a módosítás?">
            Ha módosítasz egy csomagot vagy elrejted a terméket, az csak az új vásárlásokra hat. A már megvett licencek
            ugyanannyi helyet adnak, és ugyanaddig érvényesek.
          </SkeletonCallout>
        }
      >
        <SkeletonCard title="Termékadatok">
          <ProductFormSkeleton submit="Mentés" />
        </SkeletonCard>
      </SplitLayout>
    </SkeletonPage>
  );
}
