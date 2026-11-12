import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AuthCard, AuthCardSkeleton } from '@/components/auth/auth-card';
import { ActionButton } from '@/components/forms/action-button';
import { LinkButton } from '@/components/link-button';
import { Message } from '@/components/message-screen';
import { SkeletonButton, SkeletonText } from '@/components/page-skeleton';
import { getSession } from '@/lib/auth/session';
import { roleLabels } from '@/lib/domain/permissions';
import { formatDateTime } from '@/lib/format';
import { getInvitationByToken } from '@/lib/services/invitations';

import { acceptInvitationAction, declineInvitationAction } from './actions';

export const metadata: Metadata = { title: 'Meghívó', robots: { index: false } };

const unusable = {
  accepted: 'Ezt a meghívót már elfogadták.',
  declined: 'Ezt a meghívót elutasították.',
  revoked: 'Ezt a meghívót visszavonták.',
  expired: 'Ez a meghívó lejárt. Kérj újat a cég adminisztrátorától.',
} as const;

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right break-words">{children}</dd>
    </div>
  );
}

async function Invitation({ params }: { params: PageProps<'/invitations/[token]'>['params'] }) {
  const { token } = await params;
  const [invitation, session] = await Promise.all([getInvitationByToken(token), getSession()]);

  const wayOn = session ? (
    <LinkButton href="/dashboard">Tovább a vezérlőpultra</LinkButton>
  ) : (
    <LinkButton href="/">Vissza a kezdőlapra</LinkButton>
  );

  if (!invitation) {
    return (
      <Message
        centered
        title="Érvénytelen meghívó"
        description="Ez a link hibás, vagy azóta új meghívót küldtek helyette."
        action={wayOn}
      />
    );
  }

  if (invitation.status !== 'pending') {
    const own = session?.user.email.toLowerCase() === invitation.email;
    const answered = { accepted: 'Ezt a meghívót már elfogadtad.', declined: 'Ezt a meghívót elutasítottad.' };
    const description =
      own && (invitation.status === 'accepted' || invitation.status === 'declined')
        ? answered[invitation.status]
        : unusable[invitation.status];
    return (
      <Message
        centered
        eyebrow={<>Meghívó: {invitation.companyName}</>}
        title="A meghívó már nem használható"
        description={description}
        action={wayOn}
      />
    );
  }

  const next = encodeURIComponent(`/invitations/${token}`);
  const wrongAccount = session && session.user.email.toLowerCase() !== invitation.email;

  return (
    <AuthCard
      title={<>Meghívó: {invitation.companyName}</>}
      description={
        invitation.invitedBy
          ? `${invitation.invitedBy} meghívott a cég licenckezelőjébe.`
          : 'Meghívtak a cég licenckezelőjébe.'
      }
      footer={session ? undefined : 'Azzal az e-mail-címmel jelentkezz be vagy regisztrálj, amelyikre a meghívó szól.'}
    >
      <div className="flex flex-col gap-5 text-sm">
        <dl className="divide-y divide-border/70">
          <Fact label="Címzett">
            <span className="font-medium">{invitation.email}</span>
          </Fact>
          <Fact label="Szerepkör">{roleLabels[invitation.role]}</Fact>
          <Fact label="Eddig fogadható el">
            <span className="nums whitespace-nowrap">{formatDateTime(invitation.expiresAt)}</span>
          </Fact>
        </dl>
        {wrongAccount && (
          <p className="text-destructive">
            Most {session.user.email} címmel vagy bejelentkezve. Jelentkezz be azzal a címmel, amelyikre a meghívó szól.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {session ? (
            <>
              <ActionButton action={acceptInvitationAction.bind(null, token)}>Elfogadás</ActionButton>
              <ActionButton
                variant="outline"
                action={declineInvitationAction.bind(null, token)}
                confirm={{
                  title: 'Elutasítod a meghívót?',
                  description: 'Ha elutasítod, ez a link többé nem használható.',
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
        </div>
      </div>
    </AuthCard>
  );
}

const sampleFacts = [
  ['Címzett', 'anna.kiss@pelda.test'],
  ['Szerepkör', 'Tag'],
  ['Eddig fogadható el', '2026. jan. 17. 15:18'],
];

function InvitationSkeleton() {
  return (
    <AuthCardSkeleton title="Meghívó: Példa Kft." description="Példa Tulajdonos meghívott a cég licenckezelőjébe.">
      <div className="flex flex-col gap-5 text-sm">
        <div className="divide-y divide-border/70">
          {sampleFacts.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
              <SkeletonText>{label}</SkeletonText>
              <SkeletonText>{value}</SkeletonText>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SkeletonButton>Elfogadás</SkeletonButton>
          <SkeletonButton>Elutasítás</SkeletonButton>
        </div>
      </div>
    </AuthCardSkeleton>
  );
}

export default function InvitationPage({ params }: PageProps<'/invitations/[token]'>) {
  return (
    <Suspense fallback={<InvitationSkeleton />}>
      <Invitation params={params} />
    </Suspense>
  );
}
