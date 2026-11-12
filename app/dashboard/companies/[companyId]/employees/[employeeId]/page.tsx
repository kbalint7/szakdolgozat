import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AccessDenied } from '@/components/access-denied';
import { Callout } from '@/components/callout';
import { Ident } from '@/components/code';
import { Detail, DetailAction, DetailList } from '@/components/detail-list';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCompanyContext } from '@/lib/auth/company';
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
  const canManage = ctx.can('employees.manage');
  const [fullTimeline, jobRoles, candidates] = await Promise.all([
    getEmployeeTimeline(companyId, employee),
    listKnownJobRoles(companyId),
    canManage ? listUnlinkedMembers(companyId) : Promise.resolve([]),
  ]);
  const timeline = showAll ? fullTimeline : fullTimeline.slice(-TIMELINE_LIMIT);
  const hidden = fullTimeline.length - timeline.length;
  const base = `/dashboard/companies/${companyId}`;
  const linkedUser = employee.linkedUser;
  const heldWithoutAccount = !linkedUser && employee.seats.some(seat => seat.status === 'assigned');
  const accountDiffers = linkedUser && (linkedUser.email !== employee.email || linkedUser.name !== employee.name);

  return (
    <>
      <PageHeader
        trail={[
          { href: base, label: ctx.company.name },
          { href: `${base}/employees`, label: 'Munkavállalók' },
        ]}
        title={employee.name ?? 'Név nélkül'}
        meta={
          <>
            <StatusBadge tone={employee.status === 'active' ? 'success' : 'neutral'}>
              {employeeStatusLabels[employee.status]}
            </StatusBadge>
            <Ident>{employee.hrId}</Ident>
          </>
        }
        actions={
          canManage && (
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
        <Callout tone="warning" title="Van helye, de még nem tudja használni">
          {candidates.length > 0
            ? 'Kapcsold össze egy fiókkal, hogy használni tudja a szoftvert.'
            : 'Még nincs fiókja a cégnél. Hívd meg a Tagok és meghívók oldalon, hogy használni tudja a szoftvert.'}
        </Callout>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Adatok</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList>
                <Detail label="Munkakör">{employee.jobRole || '–'}</Detail>
                <Detail label="E-mail-cím a HR-rendszerben">{employee.email ?? '–'}</Detail>
              </DetailList>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Szoftverek</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.seats.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nincs helye, és várólistán sem áll.</p>
              ) : (
                <DetailList>
                  {employee.seats.map(seat => (
                    <Detail
                      key={seat.productId}
                      label={
                        <Link
                          href={`${base}/licenses/${seat.productId}`}
                          className="rounded-sm hover:text-foreground hover:underline focus-visible:text-foreground"
                        >
                          {seat.productName}
                        </Link>
                      }
                    >
                      {seat.status === 'assigned' ? (
                        <StatusBadge tone="success">Kiosztva</StatusBadge>
                      ) : (
                        <StatusBadge tone="warning">{seat.position}. a várólistán</StatusBadge>
                      )}
                    </Detail>
                  ))}
                </DetailList>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Felhasználói fiók</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList>
                <Detail label="Állapot">
                  {linkedUser ? (
                    <StatusBadge tone="success">Összekapcsolva</StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Nincs összekapcsolva</StatusBadge>
                  )}
                </Detail>
                {linkedUser && accountDiffers && (
                  <Detail label="Fiók">
                    {linkedUser.name}
                    <div className="text-[13px] wrap-anywhere text-muted-foreground">{linkedUser.email}</div>
                  </Detail>
                )}
              </DetailList>
              {canManage && (
                <DetailAction>
                  <LinkControls
                    companyId={companyId}
                    employeeId={employee.id}
                    linkedUser={linkedUser}
                    candidates={candidates}
                    hasSeat={employee.seats.some(seat => seat.status === 'assigned')}
                  />
                </DetailAction>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Idővonal</CardTitle>
          </CardHeader>
          <CardContent>
            {hidden > 0 && (
              <p className="mb-4 text-sm text-muted-foreground">
                A legutóbbi {timeline.length} bejegyzés látszik.{' '}
                <Link href="?all=1" className="font-medium text-foreground underline underline-offset-4">
                  Az összes ({fullTimeline.length}) megjelenítése
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
