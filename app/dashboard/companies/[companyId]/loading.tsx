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
      <SkeletonPageHeader title="w-48" description="w-80" meta={2} actions={2} />
      <SkeletonStatGrid hint />
      <SkeletonSection title="w-48" description="w-2xl" actions>
        <SkeletonTileGrid tile="pool" count={2} className="md:grid-cols-2" />
      </SkeletonSection>
    </SkeletonPage>
  );
}
