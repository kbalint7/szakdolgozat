'use client';

import {
  SkeletonButton,
  SkeletonCard,
  SkeletonField,
  SkeletonForm,
  SkeletonPage,
  SkeletonPageHeader,
} from '@/components/page-skeleton';
import { useViewerRole } from '@/components/shell/viewer-role';
import { Narrow } from '@/components/split-layout';

import { settingsCopy } from './copy';

function LeaveCard() {
  return (
    <SkeletonCard title="Kilépés a cégből" description={settingsCopy.leave}>
      <SkeletonButton className="max-sm:w-full">Kilépés</SkeletonButton>
    </SkeletonCard>
  );
}

export function SettingsSkeleton() {
  const role = useViewerRole();
  const owner = role === 'owner';
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        trail="‹ Példa Kft."
        trailMobileOnly
        title="Beállítások"
        description={role && !owner ? settingsCopy.memberDescription : settingsCopy.ownerDescription}
      />
      <Narrow className="gap-4">
        {owner ? (
          <>
            <SkeletonCard title="Cégadatok">
              <SkeletonForm submit="Mentés">
                <SkeletonField label="Cégnév" description="A meghívókban is ez a név jelenik meg." />
                <SkeletonField label="Leírás (nem kötelező)" kind="textarea" />
              </SkeletonForm>
            </SkeletonCard>
            <SkeletonCard
              title="Cég törlése"
              description={`${settingsCopy.deleteBeforeLink} ${settingsCopy.deleteLink} ${settingsCopy.deleteAfterLink}`}
            >
              <SkeletonForm submit="Cég végleges törlése">
                <SkeletonField label="A megerősítéshez írd be a cég nevét: Példa Kft." />
              </SkeletonForm>
            </SkeletonCard>
          </>
        ) : (
          <LeaveCard />
        )}
      </Narrow>
    </SkeletonPage>
  );
}
