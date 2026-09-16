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
      <SkeletonStatGrid hint />
      <SkeletonSection title="w-36" description="w-80" actions>
        <SkeletonTileGrid tile="software" count={3} className="gap-3 sm:grid-cols-2 xl:grid-cols-3" />
      </SkeletonSection>
      <SkeletonSection title="w-24" description="w-56" actions>
        <SkeletonTileGrid tile="company" count={2} />
      </SkeletonSection>
    </SkeletonPage>
  );
}
