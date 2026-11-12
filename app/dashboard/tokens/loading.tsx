import {
  SkeletonCard,
  SkeletonField,
  SkeletonForm,
  SkeletonMeta,
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonRowAction,
  SkeletonStatus,
  SkeletonTable,
  SkeletonText,
} from '@/components/page-skeleton';
import { Narrow } from '@/components/split-layout';
import { TwoLine } from '@/components/table-card';

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        title="Klienstokenek"
        description="A szoftverek a tokenedről ismernek fel. Hozz létre egyet, és add meg a szoftver beállításaiban."
      />
      <Narrow>
        <SkeletonTable
          rows={1}
          header="max-lg:hidden"
          columns={[
            {
              head: 'w-full lg:w-48',
              label: 'Token',
              cell: 'max-lg:whitespace-normal',
              content: (
                <>
                  <TwoLine
                    title={
                      <span className="flex items-center justify-between gap-3">
                        <SkeletonText>Munkahelyi laptop</SkeletonText>
                        <span className="shrink-0 font-normal lg:hidden">
                          <SkeletonStatus>Aktív</SkeletonStatus>
                        </span>
                      </span>
                    }
                    sub={
                      <>
                        <span className="font-mono text-xs max-lg:hidden">
                          <SkeletonText>lm_ct_ab12cd34_…</SkeletonText>
                        </span>
                        <SkeletonMeta
                          className="lg:hidden"
                          items={['lm_ct_ab12cd34_…', 'utoljára használva: 2026. jan. 10. 15:18']}
                        />
                      </>
                    }
                  />
                  <SkeletonRowAction className="mt-1.5 mr-0 mb-0 -ml-2.5 lg:hidden">Visszavonás</SkeletonRowAction>
                </>
              ),
            },
            {
              head: 'hidden xl:table-cell xl:w-31',
              label: 'Létrehozva',
              cell: 'hidden xl:table-cell',
              content: <SkeletonText>2026. 01. 01.</SkeletonText>,
            },
            {
              head: 'hidden lg:table-cell lg:w-42',
              label: 'Utoljára használva',
              cell: 'hidden lg:table-cell',
              content: <SkeletonText>2026. jan. 10. 15:18</SkeletonText>,
            },
            {
              head: 'lg:w-31',
              label: 'Állapot',
              cell: 'max-lg:hidden',
              content: <SkeletonStatus>Aktív</SkeletonStatus>,
            },
            {
              head: 'w-px md:w-auto',
              cell: 'text-right max-lg:hidden',
              content: <SkeletonRowAction>Visszavonás</SkeletonRowAction>,
            },
          ]}
        />
        <SkeletonCard title="Új token">
          <SkeletonForm submit="Token létrehozása">
            <SkeletonField label="Név" />
          </SkeletonForm>
        </SkeletonCard>
      </Narrow>
    </SkeletonPage>
  );
}
