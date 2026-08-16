import type { Metadata } from 'next';

import { Callout } from '@/components/callout';
import { ActionButton } from '@/components/forms/action-button';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCompanyContext } from '@/lib/auth/company';
import { roleLabels } from '@/lib/domain/permissions';

import { deleteCompanyAction, leaveCompanyAction, updateCompanyAction } from '../../actions';
import { CompanyForm, DeleteCompanyForm } from '../../company-forms';

export const metadata: Metadata = { title: 'Cég beállításai' };

export default async function CompanySettingsPage({ params }: PageProps<'/dashboard/companies/[companyId]/settings'>) {
  const { companyId } = await params;
  const ctx = await getCompanyContext(companyId);

  return (
    <>
      <PageHeader
        eyebrow={ctx.company.name}
        title="Beállítások"
        description={`A szerepköröd ebben a cégben: ${roleLabels[ctx.role].toLowerCase()}.`}
      />

      {ctx.can('company.edit') ? (
        <Card>
          <CardHeader>
            <CardTitle>Cégadatok</CardTitle>
            <CardDescription>A név a meghívókban is megjelenik.</CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyForm
              action={updateCompanyAction.bind(null, companyId)}
              defaultValues={{ name: ctx.company.name, description: ctx.company.description }}
              submitLabel="Mentés"
            />
          </CardContent>
        </Card>
      ) : (
        <Callout tone="info">A cég nevét és leírását csak a tulajdonos módosíthatja.</Callout>
      )}

      {ctx.can('company.leave') && (
        <Card>
          <CardHeader>
            <CardTitle>Kilépés a cégből</CardTitle>
            <CardDescription>
              Elveszíted a hozzáférést a cég kezelőfelületéhez. Ha munkavállalóként helyed van, az megmarad, de a
              szoftvert nem tudod használni, amíg újra össze nem kapcsolnak.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActionButton
              variant="destructive"
              action={leaveCompanyAction.bind(null, companyId)}
              confirm={{
                title: 'Kilépsz a cégből?',
                description: `Kilépés után csak új meghívóval csatlakozhatsz újra a(z) ${ctx.company.name} céghez.`,
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
        <Card className="ring-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Cég törlése</CardTitle>
            <CardDescription>
              Minden kiosztott hely visszavonásra kerül, az API-kulcsok és a függő meghívók érvénytelenné válnak. Az
              audit napló megmarad. A tulajdonos nem léphet ki a cégből; ha nem szeretnéd törölni, add át a
              tulajdonjogot a Tagok oldalon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteCompanyForm action={deleteCompanyAction.bind(null, companyId)} companyName={ctx.company.name} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
