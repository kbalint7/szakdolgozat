import {
  SkeletonBadge,
  SkeletonCard,
  SkeletonDetailList,
  SkeletonField,
  SkeletonForm,
  SkeletonLine,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonTimeline,
} from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader back title="w-48" description="w-24" meta={3} actions={1} />
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <div className="flex flex-col gap-6">
          <SkeletonCard title="w-16" description={false}>
            <SkeletonDetailList items={5} />
          </SkeletonCard>
          <SkeletonCard title="w-16" description="w-full">
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <SkeletonLine size="sm" w="w-24" />
                  <SkeletonBadge />
                </div>
              ))}
            </div>
          </SkeletonCard>
          <SkeletonCard title="w-32" description="w-full">
            <SkeletonForm submit="w-24" className="gap-3">
              <SkeletonField />
            </SkeletonForm>
          </SkeletonCard>
        </div>
        <SkeletonCard title="w-20" description="w-80">
          <SkeletonTimeline items={6} />
        </SkeletonCard>
      </div>
    </SkeletonPage>
  );
}
