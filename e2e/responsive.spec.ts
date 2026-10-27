import { expect, test, type Page } from '@playwright/test';

import { login } from './helpers';

test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

async function expectNoHorizontalScroll(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    culprits: [...document.querySelectorAll('body *')]
      .filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.right > document.documentElement.clientWidth + 1 && !element.closest('[data-slot=table-container]');
      })
      .slice(0, 5)
      .map(element => `${element.tagName.toLowerCase()}.${String(element.className).slice(0, 60)}`),
  }));
  expect(overflow.culprits, `${path} overflows horizontally`).toEqual([]);
  expect(overflow.scrollWidth, path).toBeLessThanOrEqual(overflow.clientWidth);
}

test('public pages fit 375 px', async ({ page }) => {
  for (const path of ['/', '/products', '/products/ide-pro', '/login', '/register']) {
    await expectNoHorizontalScroll(page, path);
  }
});

test('dashboard and company screens fit 375 px', async ({ page }) => {
  await login(page, 'tulajdonos@pelda.test', 'Demo1234');
  await expect(page).toHaveURL(/\/dashboard$/);
  await page
    .getByRole('link', { name: /Példa Kft\./ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/dashboard\/companies\/[0-9a-f-]{36}$/);
  const company = new URL(page.url()).pathname;

  const paths = [
    '/dashboard',
    '/dashboard/software',
    '/dashboard/tokens',
    '/dashboard/profile',
    company,
    `${company}/members`,
    `${company}/employees`,
    `${company}/rules`,
    `${company}/licenses`,
    `${company}/events`,
    `${company}/checks`,
    `${company}/api-keys`,
    `${company}/audit`,
    `${company}/settings`,
  ];
  for (const path of paths) await expectNoHorizontalScroll(page, path);

  await page.getByRole('button', { name: 'Menü megnyitása' }).click();
  await expect(page.getByRole('dialog').getByRole('link', { name: 'Munkavállalók' })).toBeVisible();
});
