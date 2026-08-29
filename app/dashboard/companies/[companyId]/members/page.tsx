import type { Metadata } from 'next';

import { AccessDenied } from '@/components/access-denied';
import { Callout } from '@/components/callout';
import { Mono } from '@/components/code';
import { ActionButton } from '@/components/forms/action-button';
import { PageHeader } from '@/components/page-header';
import { Section } from '@/components/section';
import { StatusBadge, type StatusTone } from '@/components/status-badge';
import { TableCard } from '@/components/table-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCompanyContext } from '@/lib/auth/company';
import { canRemoveMember, roleLabels } from '@/lib/domain/permissions';
import { formatDate, formatDateTime } from '@/lib/format';
import { listMembers } from '@/lib/services/companies';
import { listInvitations } from '@/lib/services/invitations';

import { revokeInvitationAction } from './actions';
import { InviteForm, RegenerateLinkButton } from './invitation-forms';
import { MemberActions } from './member-actions';

const invitationStatus: Record<string, { label: string; tone: StatusTone }> = {
  pending: { label: 'Függő', tone: 'info' },
  accepted: { label: 'Elfogadva', tone: 'success' },
  declined: { label: 'Elutasítva', tone: 'neutral' },
  revoked: { label: 'Visszavonva', tone: 'danger' },
  expired: { label: 'Lejárt', tone: 'warning' },
};

export const metadata: Metadata = { title: 'Tagok és meghívók' };

export default async function MembersPage({ params }: PageProps<'/dashboard/companies/[companyId]/members'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);
  if (!ctx.can('members.view')) return <AccessDenied />;

  const [members, invitations] = await Promise.all([listMembers(companyId), listInvitations(companyId)]);

  return (
    <>
      <PageHeader
        eyebrow={ctx.company.name}
        title="Tagok és meghívók"
        description="Akik beléphetnek a cég felületére. A szerepkör önmagában nem jelenti, hogy a szoftvereket is használhatják."
      />

      <Section title="Tagok" description={`${members.length} tag`}>
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Név</TableHead>
                <TableHead>Szerepkör</TableHead>
                <TableHead>Munkavállaló</TableHead>
                <TableHead>Csatlakozott</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(member => {
                const isSelf = member.user.id === ctx.user.id;
                return (
                  <TableRow key={member.membershipId}>
                    <TableCell>
                      <div className="font-medium">
                        {member.user.name}
                        {isSelf && <span className="ml-1 font-normal text-muted-foreground">(te)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{member.user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.role === 'member' ? 'secondary' : 'default'}>
                        {roleLabels[member.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.employee?.id ? (
                        <Mono>{member.employee.hrId}</Mono>
                      ) : (
                        <span className="text-muted-foreground">nincs kapcsolva</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(member.joinedAt)}</TableCell>
                    <TableCell className="text-right">
                      {!isSelf && (
                        <MemberActions
                          companyId={companyId}
                          member={{ membershipId: member.membershipId, name: member.user.name, role: member.role }}
                          canChangeRole={ctx.can('members.changeRole') && member.role !== 'owner'}
                          canTransfer={ctx.can('company.transferOwnership') && member.role !== 'owner'}
                          canRemove={ctx.can('members.remove') && canRemoveMember(ctx.role, member.role)}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
      </Section>

      {ctx.can('members.invite') && (
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Card>
            <CardHeader>
              <CardTitle>Meghívás</CardTitle>
              <CardDescription>
                A meghívott a linken keresztül, bejelentkezve csatlakozhat. A link 7 napig érvényes és egyszer
                használható.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InviteForm companyId={companyId} canInviteAdmins={ctx.can('members.changeRole')} />
            </CardContent>
          </Card>
          <Callout tone="note" title="Fiók és munkavállaló összekapcsolása" className="h-fit">
            Ha a meghívott e-mail-címe szerepel a munkavállalók között, elfogadáskor automatikusan összekapcsoljuk a
            fiókját a munkavállalói adataival. Szoftvert csak összekapcsolt fiókkal lehet használni.
          </Callout>
        </div>
      )}

      {invitations.length > 0 && (
        <Section
          title="Meghívók"
          description="Az új belépőknek automatikusan készült meghívók is itt jelennek meg; itt kérhetsz új linket is."
        >
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Szerepkör</TableHead>
                  <TableHead>Munkavállaló</TableHead>
                  <TableHead>Meghívta</TableHead>
                  <TableHead>Lejár</TableHead>
                  <TableHead>Állapot</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map(invitation => {
                  const status = invitationStatus[invitation.status] ?? { label: invitation.status, tone: 'neutral' };
                  return (
                    <TableRow key={invitation.id}>
                      <TableCell>{invitation.email}</TableCell>
                      <TableCell>{roleLabels[invitation.role]}</TableCell>
                      <TableCell>{invitation.employee?.hrId ? <Mono>{invitation.employee.hrId}</Mono> : '–'}</TableCell>
                      <TableCell>{invitation.invitedBy ?? 'automatikus'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(invitation.expiresAt)}</TableCell>
                      <TableCell>
                        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                      </TableCell>
                      <TableCell>
                        {(invitation.status === 'pending' || invitation.status === 'expired') &&
                          ctx.can('members.invite') && (
                            <div className="flex justify-end gap-1">
                              <RegenerateLinkButton companyId={companyId} invitationId={invitation.id} />
                              <ActionButton
                                variant="ghost"
                                size="sm"
                                action={revokeInvitationAction.bind(null, companyId, invitation.id)}
                                confirm={{
                                  title: 'Visszavonod a meghívót?',
                                  description: `A(z) ${invitation.email} címre küldött link érvénytelen lesz.`,
                                  confirmLabel: 'Visszavonás',
                                  destructive: true,
                                }}
                              >
                                Visszavonás
                              </ActionButton>
                            </div>
                          )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableCard>
        </Section>
      )}
    </>
  );
}
