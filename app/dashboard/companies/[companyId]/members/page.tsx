import type { Metadata } from 'next';

import { AccessDenied } from '@/components/access-denied';
import { PageHeader } from '@/components/page-header';
import { Section } from '@/components/section';
import { TableCard } from '@/components/table-card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getCompanyContext } from '@/lib/auth/company';
import { canRemoveMember, roleLabels } from '@/lib/domain/permissions';
import { formatDate } from '@/lib/format';
import { listMembers } from '@/lib/services/companies';

import { MemberActions } from './member-actions';

export const metadata: Metadata = { title: 'Tagok' };

export default async function MembersPage({ params }: PageProps<'/dashboard/companies/[companyId]/members'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);
  if (!ctx.can('members.view')) return <AccessDenied />;

  const members = await listMembers(companyId);

  return (
    <>
      <PageHeader
        eyebrow={ctx.company.name}
        title="Tagok"
        description="Akik beléphetnek a cég felületére. A szerepkör önmagában nem jelenti, hogy a szoftvereket is használhatják."
      />

      <Section title="Tagok" description={`${members.length} tag`}>
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Név</TableHead>
                <TableHead>Szerepkör</TableHead>
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
    </>
  );
}
