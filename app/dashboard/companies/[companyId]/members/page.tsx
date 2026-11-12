import { cn } from 'cn';
import { ChevronDownIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { AccessDenied } from '@/components/access-denied';
import { Ident } from '@/components/code';
import { MetaLine } from '@/components/meta-line';
import { PageHeader } from '@/components/page-header';
import { Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import { ActionHead, EmptyRow, TableCard, TwoLine } from '@/components/table-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCompanyContext } from '@/lib/auth/company';
import { canRemoveMember, roleLabels } from '@/lib/domain/permissions';
import { formatDate, formatUntil } from '@/lib/format';
import { listMembers } from '@/lib/services/companies';
import { listInvitations } from '@/lib/services/invitations';

import { InvitationActions, InviteForm } from './invitation-forms';
import { MemberActions } from './member-actions';

type Invitation = Awaited<ReturnType<typeof listInvitations>>[number];

export const metadata: Metadata = { title: 'Tagok és meghívók' };

const nameColumn = 'w-full md:w-60 lg:w-72 xl:w-80';
const roleColumn = 'hidden lg:table-cell lg:w-36';
const thirdColumn = 'hidden lg:table-cell lg:w-48 xl:w-64';

function outcome(invitation: Invitation): { label: string; at: Date | null } {
  switch (invitation.status) {
    case 'accepted':
      return { label: 'Elfogadva', at: invitation.acceptedAt };
    case 'declined':
      return { label: 'Elutasítva', at: invitation.declinedAt };
    default:
      return { label: 'Visszavonva', at: invitation.revokedAt };
  }
}

export default async function MembersPage({ params }: PageProps<'/dashboard/companies/[companyId]/members'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);
  if (!ctx.can('members.view')) return <AccessDenied />;

  const [members, invitations] = await Promise.all([listMembers(companyId), listInvitations(companyId)]);
  const base = `/dashboard/companies/${companyId}`;
  const canInvite = ctx.can('members.invite');
  const open = invitations.filter(invitation => invitation.status === 'pending' || invitation.status === 'expired');
  const closed = invitations.filter(invitation => !open.includes(invitation));

  return (
    <>
      <PageHeader
        trail={[{ href: base, label: ctx.company.name }]}
        trailMobileOnly
        title="Tagok és meghívók"
        description="A tagok léphetnek be a cég felületére. Szoftvert nem a tagság ad, hanem a munkakör."
      />

      <Section title="Tagok" count={members.length}>
        <TableCard>
          <Table>
            <TableHeader className="max-lg:hidden">
              <TableRow>
                <TableHead className={nameColumn}>Név</TableHead>
                <TableHead className={roleColumn}>Szerepkör</TableHead>
                <TableHead className={thirdColumn}>Munkavállaló</TableHead>
                <TableHead className="hidden xl:table-cell xl:w-36">Csatlakozott</TableHead>
                <ActionHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(member => {
                const isSelf = member.user.id === ctx.user.id;
                return (
                  <TableRow key={member.membershipId}>
                    <TableCell className={cn(nameColumn, 'max-md:whitespace-normal')}>
                      <TwoLine
                        title={
                          <span className="block md:truncate">
                            {member.user.name}
                            {isSelf && <span className="ml-1.5 font-normal text-muted-foreground">(te)</span>}
                          </span>
                        }
                        sub={
                          <>
                            <span className="block truncate max-lg:hidden">{member.user.email}</span>
                            <MetaLine className="lg:hidden" items={[roleLabels[member.role], member.user.email]} />
                          </>
                        }
                      />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{roleLabels[member.role]}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {member.employee?.id ? (
                        <Link
                          href={`${base}/employees/${member.employee.id}`}
                          className="group/employee inline-flex max-w-full min-w-0 items-baseline gap-2"
                        >
                          <span className="min-w-0 truncate group-hover/employee:underline">
                            {member.employee.name ?? <span className="text-muted-foreground">Név nélkül</span>}
                          </span>
                          <Ident>{member.employee.hrId}</Ident>
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </TableCell>
                    <TableCell className="nums hidden text-muted-foreground xl:table-cell">
                      {formatDate(member.joinedAt)}
                    </TableCell>
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

      <Section title="Meghívók" count={open.length > 0 ? open.length : undefined}>
        <TableCard>
          {canInvite && <InviteForm companyId={companyId} canInviteAdmins={ctx.can('members.changeRole')} />}

          {open.length === 0 ? (
            <EmptyRow>Nincs függő meghívó.</EmptyRow>
          ) : (
            <Table>
              <TableHeader className="max-lg:hidden">
                <TableRow>
                  <TableHead className={nameColumn}>E-mail-cím</TableHead>
                  <TableHead className={roleColumn}>Szerepkör</TableHead>
                  <TableHead className={thirdColumn}>Érvényes</TableHead>
                  {canInvite && <ActionHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {open.map(invitation => {
                  const validity =
                    invitation.status === 'expired' ? (
                      <StatusBadge tone="warning">Lejárt</StatusBadge>
                    ) : (
                      formatUntil(invitation.expiresAt)
                    );
                  return (
                    <TableRow key={invitation.id}>
                      <TableCell className={cn(nameColumn, 'max-md:whitespace-normal')}>
                        <TwoLine
                          title={<span className="block max-md:wrap-anywhere md:truncate">{invitation.email}</span>}
                          sub={
                            <>
                              <span className="block truncate max-lg:hidden">
                                {invitation.invitedBy
                                  ? `Meghívta: ${invitation.invitedBy}`
                                  : 'Aki meghívta, már törölte a fiókját'}
                              </span>
                              <MetaLine className="lg:hidden" items={[roleLabels[invitation.role], validity]} />
                            </>
                          }
                        />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{roleLabels[invitation.role]}</TableCell>
                      <TableCell className="nums hidden text-muted-foreground lg:table-cell">{validity}</TableCell>
                      {canInvite && (
                        <TableCell className="text-right">
                          <InvitationActions
                            companyId={companyId}
                            invitation={{ id: invitation.id, email: invitation.email }}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {closed.length > 0 && (
            <details className="group border-t border-border/70">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-2.5 text-[13px] text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:bg-muted/50 focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
                Lezárt meghívók
                <span className="nums">{closed.length}</span>
                <ChevronDownIcon aria-hidden className="ml-auto size-4 transition-transform group-open:rotate-180" />
              </summary>
              <Table className="border-t border-border/70 text-muted-foreground">
                <TableBody>
                  {closed.map(invitation => {
                    const { label, at } = outcome(invitation);
                    return (
                      <TableRow key={invitation.id}>
                        <TableCell className={cn(nameColumn, 'max-md:whitespace-normal')}>
                          <span className="block max-md:wrap-anywhere md:truncate">{invitation.email}</span>
                          <div className="nums text-[13px] leading-4 lg:hidden">
                            {label}: {formatDate(at)}
                          </div>
                        </TableCell>
                        <TableCell className={roleColumn}>{label}</TableCell>
                        <TableCell className="nums hidden lg:table-cell">{formatDate(at)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </details>
          )}
        </TableCard>
      </Section>
    </>
  );
}
