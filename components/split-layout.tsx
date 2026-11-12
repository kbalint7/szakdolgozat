import { cn } from 'cn';

export function Narrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex w-full max-w-[46rem] flex-col gap-7', className)}>{children}</div>;
}

export function SplitLayout({
  children,
  aside,
  className,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid items-start gap-x-10 gap-y-6 xl:grid-cols-[minmax(0,46rem)_minmax(0,1fr)]', className)}>
      <Narrow>{children}</Narrow>
      {aside && <aside className="max-w-[46rem] xl:pt-1">{aside}</aside>}
    </div>
  );
}
