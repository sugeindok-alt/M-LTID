import { test, expect } from '@playwright/test';

test('public recipe has matching structured data, share image and canonical URL', async ({
  page,
  request,
}) => {
  await page.goto('/oppskrifter/nn-laks-med-ris?porsjonar=2');
  const data = JSON.parse(await page.locator('script[type="application/ld+json"]').innerText());
  expect(data['@type']).toBe('Recipe');
  expect(data.name).toBe(await page.locator('h1').innerText());
  expect(data.recipeYield).toBe('4 porsjonar');
  expect(data.totalTime).toBe('PT30M');
  expect(data.recipeInstructions.length).toBeGreaterThan(2);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', data.image[0]);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    'content',
    data.description,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', data.url);
  expect(data.url).not.toContain('?');
  const asset = new URL(data.image[0]).pathname;
  expect((await request.get(asset)).ok()).toBe(true);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain(data.url);
  expect(sitemap).not.toMatch(/\/(kokebok|boker|mi-veke|handleliste|profil|favorittar)(\/|<)/);
  const rules = await (await request.get('/robots.txt')).text();
  expect(rules).toContain('Disallow: /kokebok');
  expect(rules).toContain('Sitemap: https://m-ltid.vercel.app/sitemap.xml');
});
