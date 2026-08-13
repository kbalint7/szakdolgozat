import { SkeletonPage, SkeletonPageHeader, SkeletonTable } from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="w-56" description="w-2xl" lines={2} actions={1} />
      <SkeletonTable columns={['w-32', 'w-20', 'w-20', 'w-40', 'w-32']} rows={2} footer />
    </SkeletonPage>
  );
}
