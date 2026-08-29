import { MailIcon, MailXIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthCardSkeleton } from '@/components/auth/auth-card';
import { Detail, DetailList } from '@/components/detail-list';
import { ActionButton } from '@/components/forms/action-button';
import { LinkButton } from '@/components/link-button';
import { StatusBadge, type StatusTone } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getSession } from '@/lib/auth/session';
import { roleLabels } from '@/lib/domain/permissions';
import { formatDateTime } from '@/lib/format';
import { getInvitationByToken } from '@/lib/services/invitations';

import { acceptInvitationAction, declineInvitationAction } from './actions';

export const metadata: Metadata = { title: 'Meghívó', robots: { index: false } };

const statusBadge: Record<string, { label: string; tone: StatusTone }> = {
  pending: { label: 'Elfogadható', tone: 'success' },
  accepted: { label: 'Felhasználva', tone: 'neutral' },
  declined: { label: 'Elutasítva', tone: 'neutral' },
  revoked: { label: 'Visszavonva', tone: 'danger' },
  expired: { label: 'Lejárt', tone: 'warning' },
};

const unusable = {
  accepted: 'Ezt a meghívót már felhasználták.',
  declined: 'Ezt a meghívót elutasították.',
  revoked: 'Ezt a meghívót visszavonták.',
  expired: 'Ez a meghívó lejárt. Kérj újat a cég adminisztrátorától.',
} as const;

function IconBox({ children, tone = 'primary' }: { children: React.ReactNode; tone?: 'primary' | 'muted' }) {
  return (
    <div
      className={
        tone === 'primary'
          ? 'mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'
          : 'mb-2 flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground'
      }
    >
      {children}
    </div>
  );
}

async function Invitation({ params }: { params: PageProps<'/invitations/[token]'>['params'] }) {
  const { token } = await params;
  const [invitation, session] = await Promise.all([getInvitationByToken(token), getSession()]);

  if (!invitation) {
    return (
      <Card className="w-full max-w-md [--card-spacing:--spacing(6)]">
        <CardHeader>
          <IconBox tone="muted">
            <MailXIcon className="size-5" />
          </IconBox>
          <CardTitle className="text-xl">Érvénytelen meghívó</CardTitle>
          <CardDescription>A link hibás, vagy a meghívót időközben lecserélték egy újra.</CardDescription>
        </CardHeader>
        <CardFooter>
          <LinkButton href="/" variant="outline">
            Vissza a kezdőlapra
          </LinkButton>
        </CardFooter>
      </Card>
    );
  }

  const next = encodeURIComponent(`/invitations/${token}`);
  const wrongAccount =
    invitation.status === 'pending' && session && session.user.email.toLowerCase() !== invitation.email;

  return (
    <Card className="w-full max-w-md [--card-spacing:--spacing(6)]">
      <CardHeader>
        <IconBox>
          <MailIcon className="size-5" />
        </IconBox>
        <CardTitle className="text-xl">Meghívó: {invitation.companyName}</CardTitle>
        <CardDescription>
          {invitation.invitedBy ? `${invitation.invitedBy} meghívott` : 'Meghívtak'} a(z) {invitation.companyName}{' '}
          licenckezelőjébe.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <DetailList className="grid-cols-2">
          <Detail label="Címzett">
            <strong>{invitation.email}</strong>
          </Detail>
          <Detail label="Szerepkör">
            <Badge variant="secondary">{roleLabels[invitation.role]}</Badge>
          </Detail>
          <Detail label="Érvényes">{formatDateTime(invitation.expiresAt)}-ig</Detail>
          <Detail label="Állapot">
            <StatusBadge tone={statusBadge[invitation.status].tone}>{statusBadge[invitation.status].label}</StatusBadge>
          </Detail>
        </DetailList>
        {invitation.status !== 'pending' && <p className="text-sm text-destructive">{unusable[invitation.status]}</p>}
        {wrongAccount && (
          <p className="text-sm text-destructive">
            Most {session.user.email} címmel vagy bejelentkezve. A meghívót csak a címzett fogadhatja el.
          </p>
        )}
      </CardContent>
      {invitation.status === 'pending' && (
        <CardFooter className="flex flex-wrap gap-2">
          {session ? (
            <>
              <ActionButton action={acceptInvitationAction.bind(null, token)}>Elfogadás</ActionButton>
              <ActionButton
                variant="outline"
                action={declineInvitationAction.bind(null, token)}
                confirm={{
                  title: 'Elutasítod a meghívót?',
                  description: 'Elutasítás után a link nem használható újra.',
                  confirmLabel: 'Elutasítás',
                  destructive: true,
                }}
              >
                Elutasítás
              </ActionButton>
            </>
          ) : (
            <>
              <LinkButton href={`/login?next=${next}`}>Bejelentkezés</LinkButton>
              <LinkButton href={`/register?next=${next}`} variant="outline">
                Regisztráció
              </LinkButton>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

export default function InvitationPage({ params }: PageProps<'/invitations/[token]'>) {
  return (
    <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
      <Suspense fallback={<AuthCardSkeleton />}>
        <Invitation params={params} />
      </Suspense>
    </div>
  );
}
