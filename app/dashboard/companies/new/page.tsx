import type { Metadata } from 'next';

import { PageHeader } from '@/components/page-header';
import { Narrow } from '@/components/split-layout';
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
        title="Új cég"
        description="Te leszel a tulajdonos. Adminisztrátorokat és tagokat a létrehozás után hívhatsz meg."
      />
      <Narrow>
        <Card>
          <CardContent>
            <CompanyForm action={createCompanyAction} submitLabel="Létrehozás" />
          </CardContent>
        </Card>
      </Narrow>
    </>
  );
}
