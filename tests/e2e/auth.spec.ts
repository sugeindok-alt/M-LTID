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
test('guest salmon login returns to the recipe; mobile week and shopping preview persist on Neon', async ({
  browser,
}) => {
  const origin = 'http://127.0.0.1:3100';
  const weekPath = '/mi-veke?veke=2026-11-02';
  const name = 'Veke ' + randomUUID(),
    email = 'veke-' + randomUUID() + '@example.test';
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    baseURL: origin,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const signup = await page.request.post('/api/auth/sign-up/email', {
    headers: { origin },
    data: { name, email, password },
  });
  expect(signup.ok()).toBe(true);
  await visitPrivateLink(page, await mailLink(name, 'verify-email'));
  await page.request.post('/api/auth/sign-out', { headers: { origin }, data: {} });
  const favoriteStatus = '**/api/library/favorites?recipeId=nn-laks';
  await page.route(favoriteStatus, (r) =>
    r.fulfill({ status: 503, json: { error: 'Mellombels feil' } }),
  );
  await page.goto('/oppskrifter/nn-laks');
  await expect(
    page.getByRole('alert').filter({ hasText: 'Favorittstatusen kunne ikkje lastast' }),
  ).toBeVisible();
  await page.unroute(favoriteStatus);
  await page.getByRole('button', { name: 'Prøv igjen', exact: true }).click();
  await page.getByRole('link', { name: 'Logg inn for å lagre', exact: true }).click();
  await expect(page).toHaveURL(/logg-inn\?next=%2Foppskrifter%2Fnn-laks/i);
  await page.getByLabel('E-postadresse', { exact: true }).fill(email);
  await page.getByLabel('Passord', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Logg inn', exact: true }).click();
  await expect(page).toHaveURL(/\/oppskrifter\/nn-laks$/);
  await page.getByRole('button', { name: 'Lagre oppskrift', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Lagra i favorittar' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.goto(weekPath);
  for (const [day, id, count] of [
    ['måndag', 'nn-laks', '2'],
    ['tysdag', 'nn-torsk', '4'],
  ]) {
    await page.getByRole('button', { name: 'Vel middag for ' + day, exact: true }).click();
    await page.getByRole('combobox', { name: 'Middag', exact: true }).selectOption(id);
    await page.getByRole('combobox', { name: 'Porsjonar', exact: true }).selectOption(count);
    await page.getByRole('button', { name: 'Lagre dagen', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Endre middag for ' + day, exact: true }),
    ).toBeVisible();
  }
  const potatoes = page.locator('.week-basket li').filter({ hasText: 'poteter' });
  await expect(potatoes).toHaveText(/poteter1\s?200 g/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('heading', {name:'Mi veke.'}).scrollIntoViewIfNeeded();
  await page.screenshot({path:'.local/week-mobile.png'});
  await page.getByRole('button', { name: 'Legg veka i handlelista' }).click();
  await expect(page.getByRole('button', { name: 'Veka er lagd i handlelista' })).toBeDisabled();
  await page.request.post('/api/auth/sign-out', { headers: { origin }, data: {} });
  await context.close();
  const fresh = await browser.newContext({ baseURL: origin });
  const again = await fresh.newPage();
  await again.goto(weekPath);
  await expect(again).toHaveURL(/logg-inn\?next=/);
  await again.getByLabel('E-postadresse', { exact: true }).fill(email);
  await again.getByLabel('Passord', { exact: true }).fill(password);
  await again.getByRole('button', { name: 'Logg inn', exact: true }).click();
  await expect(again).toHaveURL(origin + weekPath);
  await expect(again.getByRole('button', { name: 'Endre middag for måndag' })).toContainText(
    'Omnsbakt laks',
  );
  await expect(again.getByRole('button', { name: 'Veka er lagd i handlelista' })).toBeDisabled();
  await fresh.close();
});
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
  await expect(pageA.getByRole('heading', { name: 'Penne med kvitlauk og chili' })).toBeVisible();
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
  await expect(pageA.getByRole('heading', { name: 'Penne med kvitlauk og chili' })).toBeVisible();
  await fresh.close();
  await b.close();
});
