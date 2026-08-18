import type { Metadata } from 'next';

import { ActionButton } from '@/components/forms/action-button';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireUser } from '@/lib/auth/session';

import { deleteAccountAction } from './actions';
import { ProfileForm } from './profile-form';

export const metadata: Metadata = { title: 'Profil' };

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader eyebrow="Személyes" title="Profil" description="A fiókod adatai." />
      <Card>
        <CardHeader>
          <CardTitle>Személyes adatok</CardTitle>
          <CardDescription>Az e-mail-címeddel jelentkezel be, ezért nem módosítható.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm name={user.name} email={user.email} />
        </CardContent>
      </Card>
      <Card className="ring-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Fiók törlése</CardTitle>
          <CardDescription>
            A fiókod és a tagságaid törlődnek. Amíg egy cég tulajdonosa vagy, a fiók nem törölhető: előbb add át a
            tulajdonjogot vagy töröld a céget.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActionButton
            variant="destructive"
            action={deleteAccountAction}
            confirm={{
              title: 'Biztosan törlöd a fiókodat?',
              description: 'A művelet nem vonható vissza. A kliens tokenjeid is érvénytelenné válnak.',
              confirmLabel: 'Fiók törlése',
              destructive: true,
            }}
          >
            Fiók törlése
          </ActionButton>
        </CardContent>
      </Card>
    </>
  );
}
