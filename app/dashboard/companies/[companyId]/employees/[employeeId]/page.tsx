import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AccessDenied } from '@/components/access-denied';
import { Callout } from '@/components/callout';
import { Mono } from '@/components/code';
import { Detail, DetailList } from '@/components/detail-list';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCompanyContext } from '@/lib/auth/company';
import { formatTimestamp } from '@/lib/format';
import { employeeStatusLabels } from '@/lib/i18n/labels';
import { getEmployee, getEmployeeTimeline } from '@/lib/services/employees';
import { listUnlinkedMembers } from '@/lib/services/invitations';
import { listKnownJobRoles } from '@/lib/services/rules';
import { isUuid } from '@/lib/validation/ids';

import { ManualEventDialog } from '../manual-event-dialog';
import { LinkControls } from './link-controls';
import { Timeline } from './timeline';

export const metadata: Metadata = { title: 'Munkavállaló' };

const TIMELINE_LIMIT = 100;

export default async function EmployeePage({
  params,
  searchParams,
}: PageProps<'/dashboard/companies/[companyId]/employees/[employeeId]'>) {
  const { companyId, employeeId } = await params;
  const ctx = await getCompanyContext(companyId);
  if (!ctx.can('employees.view')) return <AccessDenied />;
  const employee = isUuid(employeeId) ? await getEmployee(companyId, employeeId) : null;
  if (!employee) notFound();

  const showAll = (await searchParams).all === '1';
  const [fullTimeline, jobRoles, candidates] = await Promise.all([
    getEmployeeTimeline(companyId, employee),
    listKnownJobRoles(companyId),
    ctx.can('employees.manage') ? listUnlinkedMembers(companyId) : Promise.resolve([]),
  ]);
  const timeline = showAll ? fullTimeline : fullTimeline.slice(-TIMELINE_LIMIT);
  const hidden = fullTimeline.length - timeline.length;
  const heldWithoutAccount = !employee.linkedUser && employee.seats.some(seat => seat.status === 'assigned');

  return (
    <>
      <PageHeader
        back={{ href: `/dashboard/companies/${companyId}/employees`, label: 'Munkavállalók' }}
        eyebrow="Munkavállaló"
        title={employee.name ?? employee.hrId}
        description={<Mono>{employee.hrId}</Mono>}
        meta={
          <>
            <StatusBadge tone={employee.status === 'active' ? 'success' : 'neutral'}>
              {employeeStatusLabels[employee.status]}
            </StatusBadge>
            {employee.jobRole && <Mono>{employee.jobRole}</Mono>}
            {employee.linkedUser ? (
              <span className="text-xs text-muted-foreground">fiók: {employee.linkedUser.email}</span>
            ) : (
              <span className="text-xs text-muted-foreground">nincs fiókhoz kapcsolva</span>
            )}
          </>
        }
        actions={
          ctx.can('employees.manage') && (
            <ManualEventDialog
              companyId={companyId}
              jobRoles={jobRoles}
              defaults={{
                hrId: employee.hrId,
                jobRole: employee.jobRole || undefined,
                type: employee.status === 'active' ? 'employee.role_changed' : 'employee.hired',
              }}
            />
          )
        }
      />

      {heldWithoutAccount && (
        <Callout tone="warning" title="A hely le van foglalva, de nem használható">
          A munkavállalónak van kiosztott helye, de amíg a fiókját nem kapcsoljátok össze a munkavállalói adataival, nem
          tudja használni a szoftvert.
        </Callout>
      )}

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Adatok</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList>
                <Detail label="Munkakör">{employee.jobRole ? <Mono>{employee.jobRole}</Mono> : '–'}</Detail>
                <Detail label="E-mail">{employee.email ?? '–'}</Detail>
                <Detail label="Kapcsolt fiók">
                  {employee.linkedUser ? `${employee.linkedUser.name} (${employee.linkedUser.email})` : 'nincs'}
                </Detail>
                <Detail label="Utolsó változás">{formatTimestamp(employee.stateAsOf)}</Detail>
                <Detail label="Utolsó esemény">
                  {employee.lastEventId ? <Mono>{employee.lastEventId}</Mono> : '–'}
                </Detail>
              </DetailList>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Helyek</CardTitle>
              <CardDescription>Szoftverenként egy hely vagy egy várólista-bejegyzés.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {employee.seats.length === 0 && <p className="text-sm text-muted-foreground">Nincs helye.</p>}
              {employee.seats.map(seat => (
                <div key={seat.productId} className="flex items-center justify-between gap-2 text-sm">
                  <Link
                    href={`/dashboard/companies/${companyId}/licenses/${seat.productId}`}
                    className="font-medium hover:underline"
                  >
                    {seat.productName}
                  </Link>
                  {seat.status === 'assigned' ? (
                    <StatusBadge tone="success">kiosztva</StatusBadge>
                  ) : (
                    <StatusBadge tone="warning">{seat.position}. a várólistán</StatusBadge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
          {ctx.can('employees.manage') && (
            <Card>
              <CardHeader>
                <CardTitle>Felhasználói fiók</CardTitle>
                <CardDescription>
                  A szoftvert az a fiók használhatja, amelyet a munkavállalóhoz kapcsoltok.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LinkControls
                  companyId={companyId}
                  employeeId={employee.id}
                  linkedUser={employee.linkedUser}
                  candidates={candidates}
                />
              </CardContent>
            </Card>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Idővonal</CardTitle>
            <CardDescription>Minden változás és döntés időrendben, az okával együtt.</CardDescription>
          </CardHeader>
          <CardContent>
            {hidden > 0 && (
              <p className="mb-4 text-sm text-muted-foreground">
                A legutóbbi {timeline.length} bejegyzés látszik.{' '}
                <Link href="?all=1" className="font-medium text-foreground underline underline-offset-4">
                  Mind a {fullTimeline.length} megjelenítése
                </Link>
              </p>
            )}
            <Timeline items={timeline} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
