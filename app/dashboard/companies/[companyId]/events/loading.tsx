import { cn } from 'cn';

import {
  SkeletonFilterBar,
  SkeletonLoadMore,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonStatus,
  SkeletonText,
} from '@/components/page-skeleton';
import { TableCard } from '@/components/table-card';

const grid =
  'grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0.5 lg:grid-cols-[9.5rem_minmax(0,12rem)_minmax(0,16rem)_minmax(0,9rem)_minmax(1rem,1fr)]';

const types = ['Belépés', 'Munkakörváltás', 'Belépés', 'Kilépés'];
const names = ['Kiss Anna E-1001', 'Nagy Bence Gábor E-1002', 'Szabó Dóra E-1003', 'Tóth Gergely E-1004'];

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        trail="‹ Példa Kft."
        trailMobileOnly
        title="HR-események"
        description="A HR-rendszerből érkezett események és a feldolgozásuk állapota."
      />
      <div className="flex flex-col gap-4">
        <SkeletonFilterBar
          search="sm:w-52"
          chips={['Mind 35', 'Függőben 0', 'Feldolgozva 33', 'Elavult 1', 'Sikertelen 1', '|', 'Többször érkezett 14']}
        />
        <TableCard footer={<SkeletonLoadMore />}>
          <div className={cn(grid, 'hidden h-10 items-center border-b px-5 text-xs font-medium lg:grid')}>
            {['Beérkezett', 'Esemény', 'Munkavállaló', 'Állapot'].map(label => (
              <span key={label}>
                <SkeletonText>{label}</SkeletonText>
              </span>
            ))}
          </div>
          <ul className="text-sm">
            {Array.from({ length: 12 }, (_, row) => (
              <li key={row} className="border-b border-border/70 last:border-0">
                <div className="px-5 py-3 pr-11 lg:pr-5">
                  <span className={grid}>
                    <span className="flex min-w-0 items-baseline gap-2 lg:order-2">
                      <span className="min-w-0 truncate font-medium">
                        <SkeletonText>{types[row % types.length]}</SkeletonText>
                      </span>
                    </span>
                    <span className="justify-self-end text-[13px] lg:order-4 lg:justify-self-start lg:text-sm">
                      <SkeletonStatus>Feldolgozva</SkeletonStatus>
                    </span>
                    <span className="col-span-2 flex min-w-0 items-baseline justify-between gap-4 lg:contents">
                      <span className="min-w-0 truncate text-[13px] lg:order-3 lg:text-sm">
                        <SkeletonText>{names[row % names.length]}</SkeletonText>
                      </span>
                      <span className="shrink-0 text-[13px] whitespace-nowrap lg:order-1 lg:text-sm">
                        <SkeletonText>2026. jan. 10. 15:18</SkeletonText>
                      </span>
                    </span>
                    <span className="hidden size-4 lg:order-5 lg:block" />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </TableCard>
      </div>
    </SkeletonPage>
  );
}
