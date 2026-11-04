import { test, expect, type Browser, type BrowserContext } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
const origin = 'http://127.0.0.1:3100';
async function account(browser: Browser, device: number) {
  const name = 'Bokdeling ' + randomUUID(),
    email = 'bok-' + randomUUID() + '@example.test',
    password = 'lokal-kokebok-' + randomUUID();
  const ctx = await browser.newContext({
    baseURL: origin,
    viewport: { width: 360, height: 800 },
    extraHTTPHeaders: { 'x-real-ip': '198.51.100.' + device },
  });
  const send = (path: string, data: unknown) =>
    ctx.request.post(path, { headers: { origin }, data });
  expect((await send('/api/auth/sign-up/email', { name, email, password })).ok()).toBe(true);
  let link = '';
  await expect
    .poll(async () => {
      for (const file of await readdir('.local/mail')) {
        const html = await readFile('.local/mail/' + file, 'utf8');
        if (html.includes('Hei ' + name + '!')) {
          link =
            html
              .match(/href="([^"]*\/api\/auth\/verify-email[^"]*)"/)?.[1]
              .replaceAll('&amp;', '&') ?? '';
          if (link) return true;
        }
      }
      return false;
    })
    .toBe(true);
  try {
    await ctx.request.get(link, { maxRedirects: 0 });
  } catch {
    throw new Error('Lokal stadfesting feila.');
  }
  expect((await send('/api/auth/sign-in/email', { email, password })).status()).toBe(200);
  return ctx;
}
test('A publishes only reviewed copies, B and a guest can read, and withdrawal closes every shared route', async ({
  browser,
}) => {
  const a = await account(browser, 155),
    b = await account(browser, 156),
    guest = await browser.newContext({ baseURL: origin });
  const send = (ctx: BrowserContext, path: string, data: unknown) =>
    ctx.request.post(path, { headers: { origin }, data });
  const createRecipe = async (title: string, photo: boolean) => {
    const id = randomUUID(),
      image = photo
        ? 'data:image/jpeg;base64,' +
          (
            await sharp({ create: { width: 3, height: 3, channels: 3, background: 'olive' } })
              .jpeg()
              .toBuffer()
          ).toString('base64')
        : null;
    expect(
      (
        await send(a, '/api/library/cookbook', {
          id,
          originalId: null,
          title,
          servings: 2,
          ingredients: [{ name: 'poteter', measure: '600 g' }],
          steps: ['Skjer potetene i båtar.'],
          image,
        })
      ).ok(),
    ).toBe(true);
    return id;
  };
  const visible = await createRecipe('Potetbåtar for to', true),
    secret = await createRecipe('Berre til familien', false);
  const command = '/api/boksamling';
  const second = await (
    await send(a, command, { action: 'create', title: 'Familieboka', description: '' })
  ).json();
  expect(
    (
      await send(a, command, {
        action: 'save',
        id: second.id,
        revision: 1,
        title: 'Familieboka',
        description: '',
        recipeIds: [visible, secret],
      })
    ).ok(),
  ).toBe(true);
  const page = await a.newPage();
  await page.goto('/kokebok');
  await page.getByText('Opprett ei kokebok', { exact: true }).click();
  await page.getByLabel('Tittel på kokeboka').fill('Kvardagsboka');
  await page.getByRole('button', { name: 'Opprett privat kokebok' }).click();
  await expect(page).toHaveURL(/\/kokebok\/boker\/[a-f0-9-]+$/);
  const id = new URL(page.url()).pathname.split('/').at(-1)!;
  await page.getByRole('checkbox', { name: 'Potetbåtar for to', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Berre til familien', exact: true }).check();
  await page.getByRole('button', { name: 'Lagre bokinnhald' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Bokinnhaldet er lagra' })).toBeVisible();
  const path = '/api/delte-boker/' + id,
    image = path + '/bilete/' + visible;
  for (const ctx of [a, b, guest]) {
    expect((await ctx.request.get(path)).status()).toBe(404);
    expect((await ctx.request.get(image)).status()).toBe(404);
  }
  await page.getByLabel('Offentleg – alle kan lese boka', { exact: true }).check();
  await page.getByLabel('Del oppskrifta «Potetbåtar for to»', { exact: true }).check();
  await page.getByLabel('Del også fotoet til «Potetbåtar for to»', { exact: true }).check();
  await page.getByRole('button', { name: 'Førehandsvis delinga' }).click();
  await expect(page.locator('.share-preview')).toContainText('Potetbåtar for to');
  await expect(page.locator('.share-preview')).not.toContainText('Berre til familien');
  const privatePhoto = page.locator('.share-preview img');
  await expect(privatePhoto).toBeVisible();
  expect(
    await privatePhoto.evaluate(async (img: HTMLImageElement) => {
      await img.decode();
      return img.naturalWidth;
    }),
  ).toBe(3);
  await page.getByLabel('Del også fotoet til «Potetbåtar for to»', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Førehandsvis delinga' }).click();
  await expect(page.locator('.share-preview')).toContainText('utan foto');
  await expect(privatePhoto).toHaveCount(0);
  await page.getByLabel('Del også fotoet til «Potetbåtar for to»', { exact: true }).check();
  await page.getByRole('button', { name: 'Førehandsvis delinga' }).click();
  await expect(privatePhoto).toBeVisible();
  expect((await guest.request.get(path)).status()).toBe(404);
  await page.getByRole('button', { name: 'Publiser denne utgåva' }).click();
  await expect(page.getByRole('link', { name: 'Opne den offentlege kokeboka' })).toBeVisible();
  const reader = await guest.newPage();
  const proxy = '/_next/image?url=' + encodeURIComponent(image) + '&w=640&q=75';
  expect((await guest.request.get(proxy)).status()).toBe(400);
  await reader.goto('/boker/' + id);
  await expect(reader.getByRole('heading', { name: 'Kvardagsboka' })).toBeVisible();
  await expect(reader.getByRole('heading', { name: 'Potetbåtar for to' })).toBeVisible();
  await expect(reader.getByText('Berre til familien', { exact: true })).toHaveCount(0);
  for (const ctx of [a, b, guest]) {
    const shared = await ctx.request.get(path);
    expect(shared.status()).toBe(200);
    expect(shared.headers()['cache-control']).toContain('no-store');
    expect((await shared.json()).recipes.map((r: { id: string }) => r.id)).toEqual([visible]);
    const photo = await ctx.request.get(image);
    expect(photo.status()).toBe(200);
    expect(photo.headers()['cache-control']).toContain('no-store');
  }
  expect((await guest.request.get('/api/delte-boker/' + second.id)).status()).toBe(404);
  expect((await b.request.get('/api/kokebok/' + visible + '/bilete')).status()).toBe(404);
  expect((await b.request.get(command + '?id=' + id)).status()).toBe(404);
  expect((await send(b, command, { action: 'withdraw', id })).status()).toBe(404);
  expect((await send(guest, command, { action: 'withdraw', id })).status()).toBe(401);
  const changed = await a.request.patch('/api/library/cookbook', {
    headers: { origin },
    data: {
      id: visible,
      title: 'Privat endring',
      servings: 4,
      ingredients: [{ name: 'lauk', measure: '1' }],
      steps: ['Del lauken.'],
      revision: 1,
    },
  });
  expect(changed.status()).toBe(200);
  expect((await (await guest.request.get(path)).json()).recipes[0].title).toBe('Potetbåtar for to');
  await page.getByLabel('Privat – berre du kan sjå boka', { exact: true }).check();
  await page.getByRole('button', { name: 'Gjer boka privat' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Delingslenkja er stengd' }),
  ).toBeVisible();
  for (const ctx of [a, b, guest]) {
    expect((await ctx.request.get(path)).status()).toBe(404);
    expect((await ctx.request.get(image)).status()).toBe(404);
  }
  await reader.reload();
  await expect(reader.getByText('Potetbåtar for to', { exact: true })).toHaveCount(0);
  expect((await a.request.get('/api/kokebok/' + visible + '/bilete')).status()).toBe(200);
  await Promise.all([a.close(), b.close(), guest.close()]);
});
