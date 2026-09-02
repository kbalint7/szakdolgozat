import { SkeletonPage, SkeletonPageHeader, SkeletonSearchBar, SkeletonTable } from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="w-44" description="w-80" actions={1} />
      <SkeletonSearchBar select />
      <SkeletonTable columns={['w-20', 'w-36', 'w-24', 'w-16', 'w-40', 'w-24']} rows={8} mono footer />
    </SkeletonPage>
  );
}
