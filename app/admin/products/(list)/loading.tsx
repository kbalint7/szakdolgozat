import {
  SkeletonButton,
  SkeletonChevron,
  SkeletonMeta,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonStatus,
  SkeletonTable,
  SkeletonText,
} from '@/components/page-skeleton';

const products = [
  ['IDE Pro', 'ide-pro'],
  ['Office Suite', 'office-suite'],
];

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        title="Termékek"
        description="A katalógus szoftverei és csomagjaik."
        actions={<SkeletonButton>Új termék</SkeletonButton>}
      />
      <SkeletonTable
        rows={products.length}
        columns={[
          {
            head: 'w-full md:w-56 xl:w-64 min-[87.5rem]:w-72',
            label: 'Termék',
            cell: 'max-lg:whitespace-normal',
            content: row => (
              <>
                <span className="block truncate leading-5 font-medium">
                  <SkeletonText>{products[row][0]}</SkeletonText>
                </span>
                <SkeletonMeta className="lg:hidden" items={[products[row][1], '3 csomag']} />
              </>
            ),
          },
          {
            head: 'hidden xl:table-cell xl:w-40',
            label: 'Azonosító',
            cell: 'hidden xl:table-cell',
            content: row => <SkeletonText>{products[row][1]}</SkeletonText>,
          },
          {
            head: 'hidden xl:table-cell xl:w-44',
            label: 'Módosítva',
            cell: 'hidden xl:table-cell',
            content: <SkeletonText>2026. jan. 10. 15:18</SkeletonText>,
          },
          { head: 'md:w-32', label: 'Állapot', content: <SkeletonStatus>Publikált</SkeletonStatus> },
          {
            head: 'hidden text-right lg:table-cell lg:w-44',
            label: 'Vásárolható csomagok',
            cell: 'hidden text-right lg:table-cell',
            content: <SkeletonText>3</SkeletonText>,
          },
          { head: 'w-px md:w-auto', cell: 'w-px pr-4 pl-0 md:w-auto', content: <SkeletonChevron /> },
        ]}
      />
    </SkeletonPage>
  );
}
