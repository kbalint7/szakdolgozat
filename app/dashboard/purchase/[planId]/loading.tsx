import { Skeleton } from '@/components/ui/skeleton';
import {
  SkeletonCard,
  SkeletonField,
  SkeletonForm,
  SkeletonLine,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSplit,
} from '@/components/page-skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader back title="w-32" description="w-72" />
      <SkeletonSplit
        aside={
          <SkeletonCard title={false} description={false} className="h-fit">
            <div className="flex flex-col gap-1">
              <Skeleton className="mb-1 size-9 rounded-lg" />
              <SkeletonLine size="sm" w="w-20" />
              <SkeletonLine size="title" w="w-32" />
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <SkeletonLine size="sm" w="w-16" />
                <SkeletonLine size="sm" w="w-16" className="justify-end" />
                <SkeletonLine size="sm" w="w-20" />
                <SkeletonLine size="sm" w="w-20" className="justify-end" />
              </div>
              <div className="flex items-end justify-between border-t pt-3">
                <SkeletonLine size="sm" w="w-20" />
                <SkeletonLine size="2xl" w="w-28" className="justify-end" />
              </div>
            </div>
          </SkeletonCard>
        }
      >
        <SkeletonCard title="w-24" description="w-80">
          <SkeletonForm submit="w-44">
            <SkeletonField />
            <SkeletonField kind="checkbox" described />
            <SkeletonLine size="sm" w="w-80" />
          </SkeletonForm>
        </SkeletonCard>
      </SkeletonSplit>
    </SkeletonPage>
  );
}
