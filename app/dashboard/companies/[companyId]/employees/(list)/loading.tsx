import {
  SkeletonButton,
  SkeletonChevron,
  SkeletonFilterBar,
  SkeletonLoadMore,
  SkeletonMeta,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonTable,
  SkeletonText,
} from '@/components/page-skeleton';

const names = ['Kiss Anna', 'Nagy Bence Gábor', 'Szabó Dóra', 'Tóth Gergely', 'Horváth Zsófia Katalin'];
const roles = ['developer', 'designer', 'developer', 'sales manager', 'developer'];

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        trail="‹ Példa Kft."
        trailMobileOnly
        title="Munkavállalók"
        description="A HR-rendszerből átvett munkavállalók és a szoftvereik."
        actions={<SkeletonButton>Esemény rögzítése</SkeletonButton>}
      />
      <div className="flex flex-col gap-4">
        <SkeletonFilterBar chips={['Mind 124', 'Aktív 120', 'Kilépett 4']} />
        <SkeletonTable
          rows={12}
          footer={<SkeletonLoadMore />}
          columns={[
            {
              head: 'w-full md:w-60 lg:w-80 xl:w-96',
              label: 'Munkavállaló',
              content: row => (
                <>
                  <span className="flex min-w-0 items-baseline gap-2.5">
                    <span className="min-w-0 truncate font-medium">
                      <SkeletonText>{names[row % names.length]}</SkeletonText>
                    </span>
                    <span className="whitespace-nowrap max-lg:hidden">
                      <SkeletonText>E-1001</SkeletonText>
                    </span>
                  </span>
                  <SkeletonMeta className="leading-4 lg:hidden" items={['E-1001', roles[row % roles.length]]} />
                </>
              ),
            },
            {
              head: 'hidden lg:table-cell lg:w-40 xl:w-60',
              label: 'Munkakör',
              cell: 'hidden lg:table-cell',
              content: row => <SkeletonText>{roles[row % roles.length]}</SkeletonText>,
            },
            {
              head: 'md:w-40 lg:w-44 xl:w-72',
              label: 'Szoftverek',
              cell: 'max-xl:whitespace-normal',
              content: <SkeletonText>IDE Pro</SkeletonText>,
            },
            { head: 'w-px md:w-auto', cell: 'w-px pr-4 pl-0 md:w-auto', content: <SkeletonChevron /> },
          ]}
        />
      </div>
    </SkeletonPage>
  );
}
