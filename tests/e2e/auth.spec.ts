import { test, expect, type Page } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { thisWeek } from '../../src/lib/week-dates';
const password = 'local-browser-test-password-123';
// Separate synthetic clients keep repeated local runs from sharing the signup quota.
function localBrowserHeaders() {
  const id = randomUUID().replaceAll('-', '');
  return { 'x-real-ip': `2001:db8:${id.slice(0, 4)}:${id.slice(4, 8)}::1` };
}
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
test('Gatekjøkken heime on mobile: log in from a scaled smashburger and shop for a planned dinner', async ({
  browser,
  request,
}) => {
  const origin = 'http://127.0.0.1:3100';
  const recipeId = 'nn-dobbel-smashburger';
  const path = '/oppskrifter/' + recipeId;
  const marker = randomUUID();
  const name = 'Gatekjøkken ' + marker;
  const email = 'gate-' + marker + '@example.test';
  const extraHTTPHeaders = localBrowserHeaders();
  // Verify the fixture in a separate request session so the phone starts as a guest.
  const signup = await request.post('/api/auth/sign-up/email', {
    headers: { origin, ...extraHTTPHeaders },
    data: { name, email, password },
  });
  expect(signup.ok()).toBe(true);
  const verification = await mailLink(name, 'verify-email');
  try {
    const result = await request.get(verification, { maxRedirects: 0 });
    expect(result.status()).toBeLessThan(400);
  } catch {
    throw new Error('Kunne ikkje stadfeste den lokale testkontoen.');
  }
  const phone = await browser.newContext({
    baseURL: origin,
    extraHTTPHeaders,
    viewport: { width: 360, height: 780 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    const page = await phone.newPage();
    await page.goto('/');
    await page.getByRole('link', { name: 'Gatekjøkken heime', exact: true }).click();
    await page.locator(`article h3 a[href="${path}"]`).click();
    const portions = page.getByRole('combobox', { name: 'Porsjonar', exact: true });
    await portions.selectOption({ label: '2 porsjonar' });
    await expect(
      page.locator('.ingredient-panel li').filter({ hasText: 'kjøtdeig' }),
    ).toContainText('300 g');
    await page.getByRole('link', { name: 'Logg inn for å bruke handlelista' }).click();
    await expect(page).toHaveURL(/\/logg-inn\?next=/);
    expect(new URL(page.url()).searchParams.get('next')).toBe(path);
    await page.getByLabel('E-postadresse', { exact: true }).fill(email);
    await page.getByLabel('Passord', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Logg inn', exact: true }).click();
    await expect(page).toHaveURL(origin + path);
    await expect(portions.locator('option:checked')).toHaveText('2 porsjonar');
    await page.getByRole('button', { name: 'Legg til i handlelista', exact: true }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Ingrediensane er lagra' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Opne meny' }).click();
    await page
      .getByRole('navigation', { name: 'Mobilmeny' })
      .getByRole('link', { name: 'Handleliste' })
      .click();
    const meat = page.getByRole('textbox', { name: 'Mengd for kjøtdeig', exact: true });
    const buns = page.getByRole('textbox', { name: 'Mengd for hamburgerbrød', exact: true });
    await expect(meat).toHaveValue('300 g');
    await expect(buns).toHaveValue('2');
    await page
      .getByRole('navigation', { name: 'Mine sider' })
      .getByRole('link', { name: 'Mi veke' })
      .click();
    await page.getByRole('button', { name: 'Vel middag for onsdag' }).click();
    await page.getByRole('combobox', { name: 'Middag', exact: true }).selectOption(recipeId);
    await portions.selectOption('3');
    await page.getByRole('button', { name: 'Lagre dagen' }).click();
    await expect(page.getByRole('button', { name: 'Endre middag for onsdag' })).toContainText(
      '3 porsjonar',
    );
    await expect(page.locator('.week-basket li').filter({ hasText: 'kjøtdeig' })).toContainText(
      '450 g',
    );
    await page.getByRole('button', { name: 'Legg veka i handlelista' }).click();
    await expect(page.getByRole('button', { name: 'Veka er lagd i handlelista' })).toBeDisabled();
    await page.getByRole('link', { name: 'Opne handlelista' }).click();
    await expect(meat).toHaveValue('750 g');
    await expect(buns).toHaveValue('5');
  } finally {
    await phone.close();
  }
});
test('ready-made dinner week on mobile: sign up, keep Monday, replace Wednesday, shop once and open the recipe', async ({
  browser,
}) => {
  const origin = 'http://127.0.0.1:3100',
    marker = randomUUID(),
    name = 'Middagsveke ' + marker;
  const ctx = await browser.newContext({
    baseURL: origin,
    viewport: { width: 360, height: 780 },
    extraHTTPHeaders: {
      'x-real-ip': `198.51.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`,
    },
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(18000);
  try {
    await page.goto('/middagsveker');
    await page
      .getByRole('link')
      .filter({ has: page.getByRole('heading', { name: 'Raske kvardagar', exact: true }) })
      .click();
    await page.getByRole('link', { name: 'Vel denne middagsveka' }).click();
    await expect(page).toHaveURL(/logg-inn\?next=/);
    const back = new URL(page.url()).searchParams.get('next');
    expect(back).toContain('mal=raske-kvardagar');
    await page.getByRole('link', { name: 'Opprett ein konto' }).click();
    expect(new URL(page.url()).searchParams.get('next')).toBe(back);
    await page.getByLabel('Namnet ditt').fill(name);
    await page
      .getByLabel('E-postadresse', { exact: true })
      .fill('meny-' + marker + '@example.test');
    await page.getByLabel('Passord', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Opprett konto' }).click();
    await visitPrivateLink(page, await mailLink(name, 'verify-email'));
    await expect(page).toHaveURL(origin + back);
    const week = new URL(page.url()).searchParams.get('veke') || thisWeek();
    expect(
      (
        await page.request.post('/api/library/week', {
          headers: { origin },
          data: { week, day: 0, recipeId: 'nn-pytt-i-panne', servings: 4 },
        })
      ).ok(),
    ).toBe(true);
    await page.reload();
    await expect(page.locator('.week-menu-preview')).toContainText('står som før');
    await page.getByRole('combobox', { name: 'Porsjonar for nye middagar' }).selectOption('2');
    await page.getByRole('button', { name: 'Legg inn 4 middagar' }).click();
    await expect(page.getByRole('button', { name: 'Endre middag for tysdag' })).toContainText(
      '2 porsjonar',
    );
    await expect(page.getByRole('button', { name: 'Endre middag for måndag' })).toContainText(
      'Pytt i panne',
    );
    await expect(page.getByRole('button', { name: 'Endre middag for tysdag' })).toContainText(
      'Spagetti med kjøtsaus',
    );
    await expect(page.getByRole('button', { name: 'Endre middag for onsdag' })).toContainText(
      'Omnsbakt laks med ris',
    );
    await page.getByRole('button', { name: 'Endre middag for onsdag' }).click();
    await page
      .getByRole('combobox', { name: 'Middag', exact: true })
      .selectOption('nn-torsk-med-eggesmor');
    await page.getByRole('combobox', { name: 'Porsjonar', exact: true }).selectOption('4');
    await page.getByRole('button', { name: 'Lagre dagen' }).click();
    await expect(page.locator('.week-basket li').filter({ hasText: 'poteter' })).toContainText(
      '1,4 kg',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'Legg veka i handlelista' }).click({ clickCount: 2 });
    await expect(page.getByRole('button', { name: 'Veka er lagd i handlelista' })).toBeDisabled();
    await page.getByRole('link', { name: 'Opne handlelista' }).click();
    await expect(page.getByRole('textbox', { name: 'Mengd for poteter' })).toHaveValue('1,4 kg');
    // Keep this page mounted: the old editor kept 600 g after the server merged the next 800 g.
    const addForm = page.locator('.shopping-form');
    const merged = page.getByRole('textbox', { name: 'Mengd for småpoteter', exact: true });
    for (const [measure, expected] of [
      ['600 g', '600 g'],
      ['800 g', '1,4 kg'],
    ]) {
      await addForm.getByLabel('Legg til ei vare').fill('småpoteter');
      await addForm.getByLabel('Mengd', { exact: true }).fill(measure);
      await addForm.getByRole('button', { name: 'Legg til', exact: true }).click();
      await expect(merged).toHaveValue(expected);
    }
    await page
      .getByRole('navigation', { name: 'Mine sider' })
      .getByRole('link', { name: 'Mi veke', exact: true })
      .click();
    await page.getByRole('link', { name: 'Opne oppskrifta for onsdag' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Kokt torsk med poteter og eggesmør' }),
    ).toBeVisible();
  } finally {
    await ctx.close();
  }
});
test('private cookbook variant follows the user from mobile to a new login on desktop', async ({
  browser,
}) => {
  const origin = 'http://127.0.0.1:3100',
    marker = randomUUID();
  const name = 'Kokebok ' + marker,
    email = 'kokebok-' + marker + '@example.test';
  const extraHTTPHeaders = localBrowserHeaders();
  const mobile = await browser.newContext({
    baseURL: origin,
    extraHTTPHeaders,
    viewport: { width: 390, height: 844 },
  });
  const page = await mobile.newPage();
  page.setDefaultTimeout(20000);
  expect(
    (
      await page.request.post('/api/auth/sign-up/email', {
        headers: { origin },
        data: { name, email, password },
      })
    ).ok(),
  ).toBe(true);
  await visitPrivateLink(page, await mailLink(name, 'verify-email'));
  await page.goto('/oppskrifter/nn-laks');
  await page.getByRole('link', { name: 'Lag min variant', exact: true }).click();
  await expect(page.getByLabel('Mengd 1', { exact: true })).toHaveValue('600 g');
  await page.getByLabel('Namn på oppskrifta').fill('Min sitronlaks');
  await page.getByLabel('Mengd 1', { exact: true }).fill('420 g');
  await page.getByLabel('Mengd 2', { exact: true }).fill('etter smak');
  await page.getByRole('textbox', { name: 'Steg 1', exact: true }).fill('Skjer sitronen i skiver.');
  await page.locator('input[type=file]').setInputFiles({
    name: 'staeande-testfoto.jpg',
    mimeType: 'image/jpeg',
    buffer: await sharp({ create: { width: 600, height: 900, channels: 3, background: '#b7b48f' } })
      .jpeg()
      .toBuffer(),
  });
  await expect(page.getByRole('img', { name: 'Foto til oppskrifta' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Lagre varianten' }).click();
  await expect(page).toHaveURL(/\/kokebok\/[0-9a-f-]{36}$/);
  const path = new URL(page.url()).pathname;
  await expect(page.getByRole('heading', { name: 'Min sitronlaks', level: 1 })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Min sitronlaks' })).toBeVisible();
  const portrait = page.locator('.detail-hero img');
  await expect
    .poll(() => portrait.evaluate((img: HTMLImageElement) => img.naturalHeight > img.naturalWidth))
    .toBe(true);
  expect(
    await portrait.evaluate(
      (img) => img.getBoundingClientRect().height / img.getBoundingClientRect().width,
    ),
  ).toBeCloseTo(1.5, 1);
  await page.request.post('/api/auth/sign-out', { headers: { origin }, data: {} });
  await mobile.close();
  const desktop = await browser.newContext({ baseURL: origin, extraHTTPHeaders });
  const again = await desktop.newPage();
  again.setDefaultTimeout(20000);
  again.setDefaultNavigationTimeout(60000);
  await login(again, email);
  await expect(again).toHaveURL(/\/profil$/);
  await again.goto('/kokebok');
  await again
    .getByRole('link')
    .filter({ has: again.getByRole('heading', { name: 'Min sitronlaks' }) })
    .click();
  await expect(again.getByRole('img', { name: 'Min sitronlaks' })).toBeVisible();
  await again.getByRole('link', { name: 'Rediger oppskrifta' }).click();
  await expect(again.getByLabel('Mengd 1', { exact: true })).toHaveValue('420 g');
  await again.getByRole('textbox', { name: 'Steg 1', exact: true }).fill('Del sitronen i to.');
  await again.getByRole('button', { name: 'Lagre endringar' }).click();
  await expect(again).toHaveURL(origin + path);
  await expect(again.locator('.step-list')).toContainText('Del sitronen i to.');
  await again.goto('/mi-veke', { waitUntil: 'domcontentloaded' });
  await again.getByRole('button', { name: 'Vel middag for måndag', exact: true }).click();
  const dinners = again.getByRole('combobox', { name: 'Middag', exact: true });
  await expect(dinners.locator('optgroup[label="Mi kokebok"] option')).toHaveText(
    'Min sitronlaks · Min variant',
  );
  await expect(dinners.locator('option[value="nn-laks"]')).toHaveCount(0);
  await expect(dinners.locator('option[value="nn-laks-med-ris"]')).toHaveText(
    'Omnsbakt laks med ris',
  );
  await dinners.selectOption(path.split('/').at(-1)!);
  await again.getByRole('combobox', { name: 'Porsjonar', exact: true }).selectOption('3');
  await again.getByRole('button', { name: 'Lagre dagen' }).click();
  await again.getByRole('link', { name: 'Opne oppskrifta for måndag' }).click();
  await expect(again).toHaveURL(origin + path + '?porsjonar=3');
  await again.reload();
  await expect(
    again.getByRole('link', { name: 'Endre porsjonstal, no 3', exact: true }),
  ).toBeVisible();
  await expect(
    again.getByRole('combobox', { name: 'Porsjonar' }).locator('option:checked'),
  ).toHaveText('3 porsjonar');
  await expect(
    again.locator('.ingredient-panel li').filter({ hasText: 'laksefilet' }),
  ).toContainText('315 g');
  await expect(again.locator('.ingredient-panel')).toContainText('etter smak');
  await again.getByRole('button', { name: 'Start matlaging' }).click();
  await again.getByRole('button', { name: 'Vis ingredienslista' }).click();
  await expect(again.locator('#cook-ingredients')).toContainText('TIL 3 PORSJONAR');
  await expect(
    again.locator('#cook-ingredients li').filter({ hasText: 'laksefilet' }),
  ).toContainText('315 g');
  await again.goto('/oppskrifter/nn-laks');
  await expect(
    again.locator('.ingredient-panel li').filter({ hasText: 'laksefilet' }),
  ).toContainText('600 g');
  await expect(again.locator('.step-list')).not.toContainText('Del sitronen i to.');
  await desktop.close();
});
test('guest salmon login returns to the recipe; mobile week and shopping preview persist on Neon', async ({
  browser,
}) => {
  const origin = 'http://127.0.0.1:3100';
  const weekPath = '/mi-veke?veke=2026-11-02';
  const name = 'Veke ' + randomUUID(),
    email = 'veke-' + randomUUID() + '@example.test';
  const extraHTTPHeaders = localBrowserHeaders();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    baseURL: origin,
    extraHTTPHeaders,
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
    ['måndag', 'nn-fiskekaker', '2'],
    ['tysdag', 'nn-torsk-med-eggesmor', '4'],
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
  await page.getByRole('heading', { name: 'Mi veke.' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.local/week-mobile.png' });
  await page.getByRole('button', { name: 'Legg veka i handlelista' }).click();
  await expect(page.getByRole('button', { name: 'Veka er lagd i handlelista' })).toBeDisabled();
  await page.request.post('/api/auth/sign-out', { headers: { origin }, data: {} });
  await context.close();
  const fresh = await browser.newContext({ baseURL: origin, extraHTTPHeaders });
  const again = await fresh.newPage();
  await again.goto(weekPath);
  await expect(again).toHaveURL(/logg-inn\?next=/);
  await again.getByLabel('E-postadresse', { exact: true }).fill(email);
  await again.getByLabel('Passord', { exact: true }).fill(password);
  await again.getByRole('button', { name: 'Logg inn', exact: true }).click();
  await expect(again).toHaveURL(origin + weekPath);
  await expect(again.getByRole('button', { name: 'Endre middag for måndag' })).toContainText(
    'Fiskekaker med poteter og gulrøter',
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
