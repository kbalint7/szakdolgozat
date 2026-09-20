import {
  SkeletonCard,
  SkeletonInlineForm,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSplit,
  SkeletonTable,
} from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="w-44" />
      <SkeletonSplit asideLines={3}>
        <SkeletonCard title="w-24">
          <SkeletonInlineForm submit="w-36" />
        </SkeletonCard>
      </SkeletonSplit>
      <SkeletonTable columns={['w-36', 'w-28', 'w-32', 'w-32', 'w-20']} rows={3} />
    </SkeletonPage>
  );
}
