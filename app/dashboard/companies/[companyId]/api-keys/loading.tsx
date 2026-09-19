import {
  SkeletonCard,
  SkeletonField,
  SkeletonForm,
  SkeletonLine,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSplit,
  SkeletonTable,
} from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="w-32" description="w-2xl" />
      <SkeletonSplit asideLines={2}>
        <SkeletonCard title="w-20" description="w-96">
          <SkeletonForm submit="w-36" className="max-w-xl">
            <SkeletonField />
            <div className="flex flex-col gap-4">
              <SkeletonLine size="sm" w="w-28" />
              <SkeletonField kind="checkbox" described />
              <SkeletonField kind="checkbox" described />
            </div>
          </SkeletonForm>
        </SkeletonCard>
      </SkeletonSplit>
      <SkeletonTable columns={['w-32', 'w-28', 'w-40', 'w-28', 'w-32', 'w-32', 'w-16']} rows={1} tall={2} />
    </SkeletonPage>
  );
}
