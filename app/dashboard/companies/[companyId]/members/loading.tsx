import {
  SkeletonButton,
  SkeletonInput,
  SkeletonMeta,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSection,
  SkeletonTable,
  SkeletonText,
} from '@/components/page-skeleton';
import { EmptyRow, TableCard, TwoLine } from '@/components/table-card';

const members = [
  ['Példa Tulajdonos', 'tulajdonos@pelda.test', 'Tulajdonos'],
  ['Példa Admin', 'admin@pelda.test', 'Adminisztrátor'],
  ['Kiss Anna', 'anna.kiss@pelda.test', 'Tag'],
];

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        trail="‹ Példa Kft."
        trailMobileOnly
        title="Tagok és meghívók"
        description="A tagok léphetnek be a cég felületére. Szoftvert nem a tagság ad, hanem a munkakör."
      />
      <SkeletonSection title="Tagok" count>
        <SkeletonTable
          rows={members.length}
          header="max-lg:hidden"
          columns={[
            {
              head: 'w-full md:w-60 lg:w-72 xl:w-80',
              label: 'Név',
              cell: 'w-full md:w-60 lg:w-72 xl:w-80 max-md:whitespace-normal',
              content: row => (
                <TwoLine
                  title={<SkeletonText>{members[row][0]}</SkeletonText>}
                  sub={
                    <>
                      <span className="block truncate max-lg:hidden">
                        <SkeletonText>{members[row][1]}</SkeletonText>
                      </span>
                      <SkeletonMeta className="lg:hidden" items={[members[row][2], members[row][1]]} />
                    </>
                  }
                />
              ),
            },
            {
              head: 'hidden lg:table-cell lg:w-36',
              label: 'Szerepkör',
              cell: 'hidden lg:table-cell',
              content: row => <SkeletonText>{members[row][2]}</SkeletonText>,
            },
            {
              head: 'hidden lg:table-cell lg:w-48 xl:w-64',
              label: 'Munkavállaló',
              cell: 'hidden lg:table-cell',
              content: <SkeletonText>Kiss Anna E-1001</SkeletonText>,
            },
            {
              head: 'hidden xl:table-cell xl:w-36',
              label: 'Csatlakozott',
              cell: 'hidden xl:table-cell',
              content: <SkeletonText>2026. jan. 10.</SkeletonText>,
            },
            {
              head: 'w-px md:w-auto',
              cell: 'text-right',
              content: <span className="-my-1 -mr-1.5 inline-flex size-7 align-middle" />,
            },
          ]}
        />
      </SkeletonSection>

      <SkeletonSection title="Meghívók">
        <TableCard>
          <div className="flex flex-col gap-3 border-b border-border/70 px-5 py-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <SkeletonInput className="sm:flex-1" />
                <SkeletonInput className="sm:w-44" />
                <SkeletonButton className="max-sm:w-full">Meghívó létrehozása</SkeletonButton>
              </div>
              <p className="text-[13px] text-pretty">
                <SkeletonText>
                  Ha ez a cím egy munkavállalóé, a meghívott fiókját automatikusan összekapcsoljuk vele.
                </SkeletonText>
              </p>
            </div>
          </div>
          <EmptyRow>
            <SkeletonText>Nincs függő meghívó.</SkeletonText>
          </EmptyRow>
        </TableCard>
      </SkeletonSection>
    </SkeletonPage>
  );
}
