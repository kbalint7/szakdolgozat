import {
  SkeletonMeta,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSection,
  SkeletonText,
} from '@/components/page-skeleton';
import { Narrow } from '@/components/split-layout';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader title="Üdv, Példa Felhasználó!" />
      <Narrow>
        <SkeletonSection title="Cégeim">
          <div className="flex items-center gap-3.5 rounded-xl bg-card p-5 shadow-card ring-1 ring-border">
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold tracking-tight">
                <SkeletonText>Példa Kft.</SkeletonText>
              </div>
              <SkeletonMeta items={['Tulajdonos', '3 tag']} />
            </div>
          </div>
        </SkeletonSection>
        <SkeletonSection title="Szoftvereim">
          <div className="rounded-xl bg-card px-5 py-3 text-sm shadow-card ring-1 ring-border">
            <div className="leading-5 font-medium">
              <SkeletonText>IDE Pro</SkeletonText>
            </div>
            <SkeletonMeta items={['Példa Kft.', '2027. nov. 10-ig']} />
          </div>
        </SkeletonSection>
      </Narrow>
    </SkeletonPage>
  );
}
