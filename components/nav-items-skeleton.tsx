import { Skeleton } from './ui/skeleton';

export async function NavItemsSkeleton() {
  return (
    <>
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-7 w-7 rounded-full" />
      </div>
    </>
  );
}
