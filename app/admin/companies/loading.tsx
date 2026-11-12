import {
  SkeletonMeta,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonTable,
  SkeletonText,
} from '@/components/page-skeleton';
import { TwoLine } from '@/components/table-card';

const companies = [
  ['Példa Kft.', 'Példa Tulajdonos', 'tulajdonos@pelda.test'],
  ['Másik Zrt.', 'Másik Tulajdonos', 'masik@pelda.test'],
];

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        title="Cégek"
        description="A cégek adatait a saját adminisztrátoraik kezelik. Itt csak megnézheted a cégeket."
      />
      <SkeletonTable
        rows={companies.length}
        columns={[
          {
            head: 'w-full md:w-auto lg:w-56 min-[87.5rem]:w-72',
            label: 'Cég',
            cell: 'max-lg:whitespace-normal',
            content: row => (
              <>
                <div className="truncate leading-5 font-medium">
                  <SkeletonText>{companies[row][0]}</SkeletonText>
                </div>
                <SkeletonMeta className="lg:hidden" items={[companies[row][1], '3 tag', '25 munkavállaló']} />
              </>
            ),
          },
          {
            head: 'hidden lg:table-cell xl:w-52 min-[87.5rem]:w-56',
            label: 'Tulajdonos',
            cell: 'hidden lg:table-cell',
            content: row => (
              <TwoLine
                title={
                  <span className="block truncate font-normal">
                    <SkeletonText>{companies[row][1]}</SkeletonText>
                  </span>
                }
                sub={
                  <span className="block truncate">
                    <SkeletonText>{companies[row][2]}</SkeletonText>
                  </span>
                }
              />
            ),
          },
          {
            head: 'hidden xl:table-cell',
            label: 'Létrehozva',
            cell: 'hidden xl:table-cell',
            content: <SkeletonText>2026. jan. 10.</SkeletonText>,
          },
          {
            head: 'hidden text-right lg:table-cell lg:w-20',
            label: 'Tagok',
            cell: 'nums hidden text-right lg:table-cell',
            content: <SkeletonText>3</SkeletonText>,
          },
          {
            head: 'hidden text-right xl:table-cell xl:w-40',
            label: 'Aktív munkavállalók',
            cell: 'nums hidden text-right xl:table-cell',
            content: <SkeletonText>25</SkeletonText>,
          },
          {
            head: 'text-right md:w-32',
            label: (
              <>
                <SkeletonText className="max-md:hidden">Érvényes licencek</SkeletonText>
                <SkeletonText className="md:hidden">Licencek</SkeletonText>
              </>
            ),
            cell: 'nums text-right',
            content: <SkeletonText>1</SkeletonText>,
          },
        ]}
      />
    </SkeletonPage>
  );
}
