import { DashboardGreet } from '@/components/dashboard-greet';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';

export default async function DashboardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-6 w-full w-[250px]" />}>
      <DashboardGreet />
    </Suspense>
  );
}
