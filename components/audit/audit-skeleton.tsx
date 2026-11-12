import { cn } from 'cn';

import {
  SkeletonButton,
  SkeletonFilterBar,
  SkeletonInput,
  SkeletonLoadMore,
  SkeletonMeta,
  SkeletonText,
} from '@/components/page-skeleton';
import { TableCard } from '@/components/table-card';

const gridBase = 'grid grid-cols-1 items-baseline gap-x-4 gap-y-0.5 xl:[&>*]:order-none';
const grids = {
  company: 'xl:grid-cols-[9.5rem_8.5rem_minmax(0,1fr)_12rem_10rem_1rem]',
  default: 'xl:grid-cols-[9.5rem_minmax(0,1fr)_13rem_11rem_1rem]',
};

const actions = ['Hely kiosztva: IDE Pro', 'Munkavállaló felvéve', 'Várólistára került: IDE Pro', 'Tag meghívva'];
const employees = ['Kiss Anna E-1001', 'Nagy Bence Gábor E-1002', 'Szabó Dóra E-1003', 'Tóth Gergely E-1004'];

export function AuditLogSkeleton({ showCompany = false }: { showCompany?: boolean }) {
  const grid = cn(gridBase, showCompany ? grids.company : grids.default);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <SkeletonButton className="w-fit gap-1.5 md:hidden">
          Szűrők
          <span className="size-4" />
        </SkeletonButton>
        <div className="hidden md:block">
          <SkeletonFilterBar search="sm:w-52">
            <SkeletonButton className="w-full justify-start pr-8 font-normal sm:w-auto">Minden művelet</SkeletonButton>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
              <SkeletonInput className="sm:w-36" />
              <SkeletonInput className="sm:w-36" />
            </div>
          </SkeletonFilterBar>
        </div>
      </div>

      <TableCard footer={<SkeletonLoadMore />}>
        <div className={cn(grid, 'hidden h-10 items-center border-b px-5 text-xs font-medium xl:grid')}>
          {['Időpont', showCompany && 'Cég', 'Mi történt', 'Munkavállaló', 'Végrehajtó']
            .filter(label => label !== false)
            .map(label => (
              <span key={label}>
                <SkeletonText>{label}</SkeletonText>
              </span>
            ))}
        </div>
        <ul className="text-sm">
          {Array.from({ length: 12 }, (_, row) => (
            <li key={row} className="border-b border-border/70 last:border-0">
              <div className="px-5 py-3 pr-11 xl:pr-5">
                <span className={grid}>
                  <span className="hidden whitespace-nowrap xl:block">
                    <SkeletonText>2026. jan. 10. 15:18</SkeletonText>
                  </span>
                  {showCompany && (
                    <span className="hidden truncate xl:block">
                      <SkeletonText>Példa Kft.</SkeletonText>
                    </span>
                  )}
                  <span className="order-1 min-w-0 font-medium text-pretty">
                    <SkeletonText>{actions[row % actions.length]}</SkeletonText>
                  </span>
                  <span className="order-2 min-w-0 truncate text-[13px] xl:text-sm">
                    <SkeletonText className={cn(row % 2 === 1 && 'max-xl:hidden')}>
                      {employees[row % employees.length]}
                    </SkeletonText>
                  </span>
                  <span className="hidden min-w-0 truncate xl:block">
                    <SkeletonText>HR-rendszer</SkeletonText>
                  </span>
                  <SkeletonMeta
                    className="order-3 min-w-0 xl:hidden"
                    items={
                      showCompany
                        ? ['2026. jan. 10. 15:18', 'Példa Kft.', 'HR-rendszer']
                        : ['2026. jan. 10. 15:18', 'HR-rendszer']
                    }
                  />
                  <span className="hidden size-4 xl:block" />
                </span>
              </div>
            </li>
          ))}
        </ul>
      </TableCard>
    </div>
  );
}
