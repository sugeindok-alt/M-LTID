import { test, expect } from '@playwright/test';
test('editorial homepage renders real images and works without horizontal overflow', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /God middag.*Heile veka\./ })).toBeVisible();
  const hero = page.locator('.hero-visual img');
  await expect(hero).toBeVisible();
  await expect
    .poll(() => hero.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
    .toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: `docs/screenshots/${info.project.name}-home.png`,
    fullPage: false,
  });
  expect(errors).toEqual([]);
});
test('responsive navigation opens and navigates with accessible labels', async ({ page }, info) => {
  await page.goto('/');
  if (info.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Opne meny' }).click();
    await expect(page.getByRole('button', { name: 'Lukk meny' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await page
      .getByRole('navigation', { name: 'Mobilmeny' })
      .getByRole('link', { name: 'Middagar', exact: true })
      .click();
  } else
    await page
      .getByRole('navigation', { name: 'Hovudmeny' })
      .getByRole('link', { name: 'Middagar', exact: true })
      .click();
  await expect(page.getByRole('heading', { name: 'Kva blir det til middag?' })).toBeVisible();
});
test('recipe search, category filtering, sorting and empty results', async ({ page }) => {
  await page.goto('/oppskrifter');
  await page.getByRole('textbox', { name: 'Søk etter oppskrift' }).fill('pasta');
  await page.getByRole('button', { name: 'Søk', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pasta med tomat og basilikum' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Kategori', exact: true }).selectOption('Pasta');
  await page.getByRole('combobox', { name: 'Sorter', exact: true }).selectOption('za');
  await page.getByRole('combobox', { name: 'Tidsbruk', exact: true }).selectOption('30');
  await page.getByRole('combobox', { name: 'Hovudingrediens', exact: true }).selectOption('Pasta');
  await page.getByRole('checkbox', { name: 'Berre vegetar' }).check();
  await page.getByRole('button', { name: 'Bruk filter' }).click();
  await expect(page).toHaveURL(/category=Pasta/);
  await expect(page.getByRole('heading', { name: 'Pasta med tomat og basilikum' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Søk etter oppskrift' }).fill('zzznorecipemaltidzzz');
  await page.getByRole('button', { name: 'Søk', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ingen middagar passar søket.' })).toBeVisible();
});
test('recipe details retain source content and checkable steps', async ({ page }, info) => {
  await page.goto('/oppskrifter/nn-pasta-tomat');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Pasta med tomat og basilikum' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ingrediensar', exact: true })).toBeVisible();
  const step = page.getByRole('button', { name: 'Merk steg 1 som ferdig', exact: true });
  await step.click();
  await expect(page.getByRole('button', { name: 'Merk steg 1 som uferdig' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByText('Ukjent – vi manglar informasjon om dei konkrete produkta', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Porsjonar' })).toHaveValue('1');
  await page.getByRole('combobox', { name: 'Porsjonar' }).selectOption('0.5');
  await expect(page.locator('.ingredient-panel').getByText('200 g', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({
    path: `docs/screenshots/${info.project.name}-recipe.png`,
    fullPage: true,
  });
});
test('ingredient discovery searches and opens actual ingredient details', async ({ page }) => {
  await page.goto('/ingrediensar');
  await page.getByRole('textbox', { name: 'Søk etter ingrediens' }).fill('tomatar');
  await page.getByRole('button', { name: 'Søk', exact: true }).first().click();
  await page
    .locator('.ingredient-catalog')
    .getByRole('link')
    .filter({ has: page.getByRole('heading', { name: 'tomatar', exact: true }) })
    .click();
  await expect(page.getByRole('heading', { name: 'tomatar', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Prosessering avheng av kva du vel.' }),
  ).toBeVisible();
});
test('product search is submit-only, labels unknown NOVA and recovers from failure', async ({
  page,
}) => {
  let calls = 0;
  await page.route('**/api/products?**', async (route) => {
    calls++;
    await route.fulfill({
      status: calls === 1 ? 502 : 200,
      contentType: 'application/json',
      body: JSON.stringify(
        calls === 1
          ? { error: 'Open Food Facts svarar ikkje som venta.' }
          : {
              products: [
                {
                  code: '12345678',
                  name: 'Testprodukt',
                  brands: 'Testdata',
                  image: null,
                  nova: null,
                  url: 'https://world.openfoodfacts.org/product/12345678',
                  ingredients: null,
                  fetchedAt: new Date().toISOString(),
                },
              ],
            },
      ),
    });
  });
  await page.goto('/ingrediensar/tomatoes');
  await page.getByLabel('Søk etter eit produktnamn eller ein strekkode').fill('12345678');
  expect(calls).toBe(0);
  await page.getByRole('button', { name: 'Søk', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Open Food Facts' })).toBeVisible();
  await page.getByRole('button', { name: 'Søk', exact: true }).click();
  await expect(page.getByText('NOVA ukjent')).toBeVisible();
  expect(calls).toBe(2);
});
test('private pages require authentication and no credentials means honest setup state', async ({
  page,
  request,
}) => {
  await page.goto('/favorittar');
  await expect(page).toHaveURL(/logg-inn/);
  await expect(page.getByRole('heading', { name: 'Velkomen tilbake.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Logg inn', exact: true })).toBeDisabled();
  const response = await request.post('/api/library/favorites', {
    headers: { origin: 'http://127.0.0.1:3000' },
    data: { recipeId: '52771', saved: true },
  });
  expect([401, 503]).toContain(response.status());
  const crossOrigin = await request.post('/api/library/favorites', {
    headers: { origin: 'https://evil.example' },
    data: { recipeId: '52771', saved: true },
  });
  expect(crossOrigin.status()).toBe(403);
});
test('unknown recipe renders a non-indexable not-found state and source explanations remain available', async ({
  page,
}) => {
  await page.goto('/oppskrifter/not-an-id');
  await expect(page.getByRole('heading', { name: 'Denne sida fann vi ikkje.' })).toBeVisible();
  await expect(page.locator('meta[name="robots"][content="noindex"]').first()).toBeAttached();
  await page.goto('/om-maten');
  await expect(
    page.getByRole('heading', { name: 'Vi klassifiserer ikkje heile middagen.' }),
  ).toBeVisible();
});
