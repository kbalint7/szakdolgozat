import {
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSection,
  SkeletonStatGrid,
  SkeletonTileGrid,
} from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="w-64" description="w-72" />
      <SkeletonStatGrid count={2} hint />
      <SkeletonSection title="w-24" description="w-56" actions>
        <SkeletonTileGrid tile="company" count={2} />
      </SkeletonSection>
    </SkeletonPage>
  );
}
