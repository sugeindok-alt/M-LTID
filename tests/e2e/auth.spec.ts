import { test, expect, type Page } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
const password = 'local-browser-test-password-123';
async function login(page: Page, email: string, pass = password) {
  await page.goto('/logg-inn');
  await page.getByLabel('E-postadresse', { exact: true }).fill(email);
  await page.getByLabel('Passord', { exact: true }).fill(pass);
  await page.getByRole('button', { name: 'Logg inn', exact: true }).click();
}
async function mailLink(name: string, kind: 'verify-email' | 'reset-password') {
  let link = '';
  await expect
    .poll(async () => {
      for (const file of await readdir('.local/mail').catch(() => [])) {
        const html = await readFile(`.local/mail/${file}`, 'utf8');
        if (!html.includes(`Hei ${name}!`)) continue;
        const found = html
          .match(/href="([^"]+)"/g)
          ?.map((v) => v.slice(6, -1).replaceAll('&amp;', '&'))
          .find((v) => v.includes(`/api/auth/${kind}`));
        if (found) {
          link = found;
          return true;
        }
      }
      return false;
    })
    .toBe(true);
  return link;
}
async function visitPrivateLink(page: Page, link: string) {
  try {
    await page.goto(link);
  } catch {
    throw new Error('Could not open local test link (token redacted).');
  }
}
test('Neon persistence, two browser accounts, verification and password reset; file mail only', async ({
  browser,
}) => {
  const run = randomUUID();
  const nameA = `Test A ${run}`,
    nameB = `Test B ${run}`;
  const emailA = `a-${run}@example.test`,
    emailB = `b-${run}@example.test`;
  const testIP = `198.51.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
  const contextOptions = { extraHTTPHeaders: { 'x-real-ip': testIP } };
  const a = await browser.newContext(contextOptions);
  const b = await browser.newContext(contextOptions);
  let pageA = await a.newPage();
  const pageB = await b.newPage();
  for (const [page, name, email] of [
    [pageA, nameA, emailA],
    [pageB, nameB, emailB],
  ] as const) {
    await page.goto('/registrer');
    await page.getByLabel('Namnet ditt').fill(name);
    await page.getByLabel('E-postadresse', { exact: true }).fill(email);
    await page.getByLabel('Passord', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Opprett konto' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Ingen e-post er send' }),
    ).toBeVisible();
    await login(page, email);
    await expect(
      page.getByRole('alert').filter({ hasText: 'Stadfest e-postadressa' }),
    ).toBeVisible();
    await visitPrivateLink(page, await mailLink(name, 'verify-email'));
    await expect(page).toHaveURL(/\/profil$/);
  }
  await pageA.goto('/oppskrifter/52771');
  await pageA.getByRole('button', { name: 'Lagre oppskrift', exact: true }).click();
  await expect(
    pageA.getByRole('button', { name: 'Lagra i favorittar', exact: true }),
  ).toBeVisible();
  await pageA.reload();
  await expect(
    pageA.getByRole('button', { name: 'Lagra i favorittar', exact: true }),
  ).toBeVisible();
  await pageB.goto('/favorittar');
  await expect(pageB.getByRole('heading', { name: 'Plass til nye favorittar.' })).toBeVisible();
  const removedByB = await pageB.request.post('/api/library/favorites', {
    headers: { origin: 'http://127.0.0.1:3100' },
    data: { recipeId: '52771', saved: false, userId: 'forged-owner' },
  });
  expect(removedByB.status()).toBe(200);
  await pageA.request.post('/api/auth/sign-out', {
    headers: { origin: 'http://127.0.0.1:3100' },
    data: {},
  });
  await a.close();
  const fresh = await browser.newContext(contextOptions);
  pageA = await fresh.newPage();
  await login(pageA, emailA);
  await expect(pageA).toHaveURL(/\/profil$/);
  await pageA.goto('/favorittar');
  await expect(pageA.getByRole('heading', { name: 'Spicy Arrabiata Penne' })).toBeVisible();
  await pageB.goto('/gloymt-passord');
  await pageB.getByLabel('E-postadresse', { exact: true }).fill(emailA);
  await pageB.getByRole('button', { name: 'Be om ny lenkje' }).click();
  await expect(pageB.getByRole('status').filter({ hasText: 'Ingen e-post er send' })).toBeVisible();
  await visitPrivateLink(pageB, await mailLink(nameA, 'reset-password'));
  await pageB.getByLabel('Passord', { exact: true }).fill('replacement-test-password-456');
  await pageB.getByRole('button', { name: 'Lagre nytt passord' }).click();
  await expect(
    pageB.getByRole('status').filter({ hasText: 'Passordet er oppdatert' }),
  ).toBeVisible();
  await pageA.reload();
  await expect(pageA).toHaveURL(/\/logg-inn/);
  await login(pageA, emailA, 'replacement-test-password-456');
  await expect(pageA).toHaveURL(/\/profil$/);
  await pageA.goto('/favorittar');
  await expect(pageA.getByRole('heading', { name: 'Spicy Arrabiata Penne' })).toBeVisible();
  await fresh.close();
  await b.close();
});
