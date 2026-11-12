import type { Metadata } from 'next';
import Link from 'next/link';

import { ActionButton } from '@/components/forms/action-button';
import { PageHeader } from '@/components/page-header';
import { Narrow } from '@/components/split-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCompanyContext } from '@/lib/auth/company';

import { deleteCompanyAction, leaveCompanyAction, updateCompanyAction } from '../../actions';
import { CompanyForm, DeleteCompanyForm } from '../../company-forms';

import { settingsCopy } from './copy';

export const metadata: Metadata = { title: 'Cég beállításai' };

export default async function CompanySettingsPage({ params }: PageProps<'/dashboard/companies/[companyId]/settings'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);
  const base = `/dashboard/companies/${companyId}`;
  const canEdit = ctx.can('company.edit');

  return (
    <>
      <PageHeader
        trail={[{ href: base, label: ctx.company.name }]}
        trailMobileOnly
        title="Beállítások"
        description={canEdit ? settingsCopy.ownerDescription : settingsCopy.memberDescription}
      />

      <Narrow className="gap-4">
        {canEdit && (
          <Card>
            <CardHeader>
              <CardTitle>Cégadatok</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyForm
                action={updateCompanyAction.bind(null, companyId)}
                defaultValues={{ name: ctx.company.name, description: ctx.company.description }}
                submitLabel="Mentés"
              />
            </CardContent>
          </Card>
        )}

        {ctx.can('company.leave') && (
          <Card>
            <CardHeader>
              <CardTitle>Kilépés a cégből</CardTitle>
              <CardDescription>{settingsCopy.leave}</CardDescription>
            </CardHeader>
            <CardContent>
              <ActionButton
                variant="destructive"
                className="max-sm:w-full"
                action={leaveCompanyAction.bind(null, companyId)}
                confirm={{
                  title: 'Kilépsz a cégből?',
                  description:
                    'Csak új meghívóval csatlakozhatsz újra. Ha a cégtől szoftvert kaptál, azt sem tudod tovább használni.',
                  confirmLabel: 'Kilépés',
                  destructive: true,
                }}
              >
                Kilépés
              </ActionButton>
            </CardContent>
          </Card>
        )}

        {ctx.can('company.delete') && (
          <Card>
            <CardHeader>
              <CardTitle>Cég törlése</CardTitle>
              <CardDescription>
                {settingsCopy.deleteBeforeLink}{' '}
                <Link href={`${base}/members`} className="font-medium text-foreground underline underline-offset-4">
                  {settingsCopy.deleteLink}
                </Link>{' '}
                {settingsCopy.deleteAfterLink}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeleteCompanyForm action={deleteCompanyAction.bind(null, companyId)} companyName={ctx.company.name} />
            </CardContent>
          </Card>
        )}
      </Narrow>
    </>
  );
}
