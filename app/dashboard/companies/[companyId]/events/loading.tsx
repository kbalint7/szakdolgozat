import {
  SkeletonCallout,
  SkeletonChips,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonTable,
} from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="w-40" description="w-2xl" />
      <SkeletonChips count={7} />
      <SkeletonTable columns={['w-28', 'w-40', 'w-20', 'w-28', 'w-24', 'w-12', 'w-24']} rows={8} tall={1} footer />
      <SkeletonCallout />
    </SkeletonPage>
  );
}
