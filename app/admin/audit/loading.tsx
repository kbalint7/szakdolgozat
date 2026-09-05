import { SkeletonFilterBar, SkeletonPage, SkeletonPageHeader, SkeletonTable } from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="w-48" description="w-2xl" />
      <SkeletonFilterBar />
      <SkeletonTable
        columns={['w-24', 'w-24', 'w-28', 'w-32', 'w-20', 'w-28', 'w-28', 'w-40']}
        rows={8}
        tall={2}
        footer
      />
    </SkeletonPage>
  );
}
