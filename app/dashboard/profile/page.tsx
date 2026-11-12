import type { Metadata } from 'next';

import { ActionButton } from '@/components/forms/action-button';
import { PageHeader } from '@/components/page-header';
import { Narrow } from '@/components/split-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireUser } from '@/lib/auth/session';

import { deleteAccountAction } from './actions';
import { ProfileForm } from './profile-form';

export const metadata: Metadata = { title: 'Profil' };

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Profil" />

      <Narrow className="gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Személyes adatok</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm name={user.name} email={user.email} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fiók törlése</CardTitle>
            <CardDescription>
              A fiókod és a tagságaid törlődnek. Ha tulajdonosa vagy egy cégnek, előbb add át a tulajdonjogot, vagy
              töröld a céget.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActionButton
              variant="destructive"
              className="max-sm:w-full"
              action={deleteAccountAction}
              confirm={{
                title: 'Törlöd a fiókodat?',
                description: 'Ezt nem lehet visszacsinálni. A klienstokenjeid sem működnek tovább.',
                confirmLabel: 'Fiók törlése',
                destructive: true,
              }}
            >
              Fiók törlése
            </ActionButton>
          </CardContent>
        </Card>
      </Narrow>
    </>
  );
}
