import { SkeletonCallout, SkeletonPage, SkeletonPageHeader, SkeletonTable } from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="w-40" />
      <SkeletonTable columns={['w-40', 'w-32', 'w-28', 'w-36']} rows={3} tall />
      <SkeletonCallout />
    </SkeletonPage>
  );
}
