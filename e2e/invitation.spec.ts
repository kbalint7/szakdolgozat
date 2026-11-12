import { expect, test } from '@playwright/test';

import { ownerWithCompany, register, uniqueEmail } from './helpers';

test('UC-03: an invited user registers from the link and joins as a member', async ({ page, browser }) => {
  const { companyUrl } = await ownerWithCompany(page, 'Meghívó Kft.');
  const inviteeEmail = uniqueEmail('invitee');

  await page.goto(`${companyUrl}/members`);
  await page.getByLabel('E-mail-cím').fill(inviteeEmail);
  await page.getByRole('button', { name: 'Meghívó létrehozása' }).click();
  const link = await page.locator('code', { hasText: '/invitations/' }).textContent();
  expect(link).toBeTruthy();
  const invitationPath = new URL(link!).pathname;

  const invitee = await (await browser.newContext()).newPage();
  await invitee.goto(invitationPath);
  await expect(invitee.getByText('Meghívó: Meghívó Kft.')).toBeVisible();
  await invitee.getByRole('main').getByRole('link', { name: 'Regisztráció' }).click();
  await expect(invitee).toHaveURL(/\/register\?next=/);
  await register(invitee, { lastName: 'Meg', firstName: 'Hívott', email: inviteeEmail }, invitationPath);
  await expect(invitee).toHaveURL(new RegExp(`${invitationPath}$`));

  await invitee.getByRole('button', { name: 'Elfogadás' }).click();
  await expect(invitee).toHaveURL(/\/dashboard\/companies\/[0-9a-f-]{36}$/);
  await expect(invitee.getByRole('heading', { name: 'Meghívó Kft.' })).toBeVisible();
  await expect(invitee.getByText('Tag', { exact: true }).first()).toBeVisible();

  await invitee.goto(invitationPath);
  await expect(invitee.getByText('Ezt a meghívót már elfogadtad.')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('row', { name: new RegExp(inviteeEmail) }).first()).toBeVisible();
});
