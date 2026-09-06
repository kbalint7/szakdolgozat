import { SkeletonPage, SkeletonPageHeader, SkeletonTable } from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="w-20" description="w-96" />
      <SkeletonTable columns={['w-28', 'w-40', 'w-12', 'w-28', 'w-24', 'w-24', 'w-16']} rows={3} tall={1} footer />
    </SkeletonPage>
  );
}
