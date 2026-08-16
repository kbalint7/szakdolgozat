import type { Metadata } from 'next';

import { Callout } from '@/components/callout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { requireUser } from '@/lib/auth/session';

import { createCompanyAction } from '../actions';
import { CompanyForm } from '../company-forms';

export const metadata: Metadata = { title: 'Új cég' };

export default async function NewCompanyPage() {
  await requireUser();
  return (
    <>
      <PageHeader
        eyebrow="Cégeim"
        title="Új cég"
        description="A cég létrehozója lesz a tulajdonos. Később meghívhatsz adminisztrátorokat és tagokat."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardContent>
            <CompanyForm action={createCompanyAction} submitLabel="Létrehozás" />
          </CardContent>
        </Card>
        <Callout tone="note" title="Ki használhatja a szoftvereket?" className="h-fit">
          A tulajdonosi és az adminisztrátori szerepkör a cég kezeléséhez ad jogot. Szoftvert az használhat, aki a cég
          munkavállalója, és a munkaköréhez hozzá van rendelve a szoftver.
        </Callout>
      </div>
    </>
  );
}
