import { Detail, DetailAction, DetailList } from '@/components/detail-list';
import {
  SkeletonButton,
  SkeletonCard,
  SkeletonMeta,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonRowAction,
  SkeletonStatus,
  SkeletonText,
} from '@/components/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

function TimelineEntry({ title, facts, decisions }: { title: string; facts: string[]; decisions: string[] }) {
  return (
    <li className="relative flex gap-3.5 pb-7 before:absolute before:top-9 before:bottom-1 before:left-4 before:w-px before:bg-border last:pb-0 last:before:hidden">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 pt-1.5">
        <div className="leading-5 font-medium">
          <SkeletonText>{title}</SkeletonText>
        </div>
        <SkeletonMeta className="mt-0.5" items={facts} />
        <ul className="mt-3 flex flex-col gap-2">
          {decisions.map(decision => (
            <li key={decision} className="flex gap-2.5 text-sm">
              <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-muted" />
              <div className="min-w-0 text-pretty">
                <SkeletonText>{decision}</SkeletonText>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        trail="Példa Kft. › Munkavállalók"
        title="Kiss Anna"
        meta={
          <>
            <SkeletonStatus>Aktív</SkeletonStatus>
            <SkeletonText>E-1001</SkeletonText>
          </>
        }
        actions={<SkeletonButton>Esemény rögzítése</SkeletonButton>}
      />
      <div className="grid items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <SkeletonCard title="Adatok">
            <DetailList>
              <Detail label={<SkeletonText>Munkakör</SkeletonText>}>
                <SkeletonText>developer</SkeletonText>
              </Detail>
              <Detail label={<SkeletonText>E-mail-cím a HR-rendszerben</SkeletonText>}>
                <SkeletonText>anna.kiss@pelda.test</SkeletonText>
              </Detail>
            </DetailList>
          </SkeletonCard>
          <SkeletonCard title="Szoftverek">
            <DetailList>
              <Detail label={<SkeletonText>IDE Pro</SkeletonText>}>
                <SkeletonStatus>Kiosztva</SkeletonStatus>
              </Detail>
            </DetailList>
          </SkeletonCard>
          <SkeletonCard title="Felhasználói fiók">
            <DetailList>
              <Detail label={<SkeletonText>Állapot</SkeletonText>}>
                <SkeletonStatus>Összekapcsolva</SkeletonStatus>
              </Detail>
            </DetailList>
            <DetailAction>
              <SkeletonRowAction className="mr-0 -ml-2.5">Fiók leválasztása</SkeletonRowAction>
            </DetailAction>
          </SkeletonCard>
        </div>
        <SkeletonCard title="Idővonal">
          <ol className="flex flex-col">
            <TimelineEntry
              title="HR-esemény: Belépés"
              facts={['2026. jan. 10. 15:18', 'HR-rendszer', 'a változás napja: 2026. jan. 1.']}
              decisions={[
                'Új munkavállaló, a munkaköre developer.',
                'IDE Pro: várólistára került · a munkaköréhez jár',
                'IDE Pro: helyet kapott · a munkaköréhez jár',
                'Meghívó létrehozva',
              ]}
            />
            <TimelineEntry
              title="Fiók és tagság"
              facts={['2026. jan. 10. 15:18']}
              decisions={['Meghívó elfogadva', 'Új tag a cégben', 'Fiók összekapcsolva a munkavállalóval']}
            />
          </ol>
        </SkeletonCard>
      </div>
    </SkeletonPage>
  );
}
