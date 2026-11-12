import { SkeletonPage, SkeletonPageHeader } from '@/components/page-skeleton';
import { Narrow } from '@/components/split-layout';

export default function Loading() {
  return (
    <SkeletonPage>
      <Narrow>
        <SkeletonPageHeader title="Példa Kft." description="Szoftverfejlesztő cég a bemutatóhoz." />
        <div aria-hidden className="h-[5.5rem] rounded-xl bg-card shadow-card ring-1 ring-border" />
      </Narrow>
    </SkeletonPage>
  );
}
