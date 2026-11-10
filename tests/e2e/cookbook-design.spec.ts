import { test, expect } from '@playwright/test';

test('a complete plate, caption and wrapping action row remain separate', async ({ page }) => {
  await page.goto('/oppskrifter/nn-pannekaker-med-bacon');
  const image = page.locator('.detail-hero img');
  await image.evaluate((img: HTMLImageElement) => img.decode());
  const ratio = await image.evaluate((img: HTMLImageElement) => ({
    natural: img.naturalWidth / img.naturalHeight,
    shown: img.width / img.height,
  }));
  expect(Math.abs(ratio.shown - ratio.natural)).toBeLessThan(0.01);
  // Wait for hydration before inserting the long caption into React-owned markup.
  await expect(page.getByRole('button', { name: 'Start matlaging', exact: true })).toBeEnabled();
  const credit = page.locator('.image-credit');
  await credit.evaluate((el) =>
    el.prepend(
      document.createTextNode(
        'Ei lang bilettekst som skal halde seg lesbar og la begge handlingane få plass. '.repeat(5),
      ),
    ),
  );
  const variant = page.getByRole('link', { name: 'Lag min variant', exact: true });
  const favorite = page.getByRole('link', { name: 'Logg inn for å lagre', exact: true });
  for (const width of [1440, 720]) {
    await page.setViewportSize({ width, height: 1000 });
    const captionBox = (await credit.boundingBox())!;
    const toolBox = (await page.locator('.detail-tools').boundingBox())!;
    expect(toolBox.y).toBeGreaterThanOrEqual(captionBox.y + captionBox.height);
    await expect(variant).toBeEnabled();
    await expect(favorite).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => {
    document.documentElement.style.zoom = '1';
  });
  await variant.click();
  await expect(page).toHaveURL(/logg-inn\?next=/);
});

test('a dinner suggestion uses the current filter and avoids the previous choice', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Under 30 minutt', exact: true }).click();
  await expect(page).toHaveURL(/maxTime=29/);
  await expect(page.locator('.recipe-grid .recipe-card h3').first()).toBeVisible();
  const eligible = await page.locator('.recipe-grid .recipe-card h3').allTextContents();
  const choice = page.getByRole('region', { name: 'La MÅLTID velje middag' });
  await choice.getByRole('button', { name: 'Vel middag for meg' }).click();
  const first = await choice.locator('h3').innerText();
  expect(eligible).toContain(first);
  await expect(choice.locator('img')).toBeVisible();
  const time = await choice.locator('.recipe-meta').innerText();
  expect(Number(time.match(/om lag (\d+) min/i)![1])).toBeLessThan(30);
  if (eligible.length > 1) {
    await choice.getByRole('button', { name: 'Prøv ein annan' }).click();
    expect(await choice.locator('h3').innerText()).not.toBe(first);
  } else await expect(choice.getByRole('button', { name: 'Prøv ein annan' })).toBeDisabled();
  await choice.locator('h3 a').click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('/oppskrifter?category=Gatekj%C3%B8kken%20heime');
  await choice.getByRole('button', { name: 'Vel middag for meg' }).click();
  const previous = await choice.locator('h3').innerText();
  await choice.getByRole('button', { name: 'Prøv ein annan' }).click();
  expect(await choice.locator('h3').innerText()).not.toBe(previous);
  await choice.locator('h3 a').click();
  await page.getByRole('button', { name: 'Start matlaging', exact: true }).click();
  const mode = page.getByRole('dialog');
  await mode.getByRole('button', { name: 'Neste', exact: true }).click();
  await expect(mode.getByRole('heading', { name: /Steg 2 av/ })).toBeVisible();
  await mode.getByRole('button', { name: 'Vis ingredienslista' }).click();
  await expect(mode.locator('#cook-ingredients')).toBeVisible();
  await mode.getByRole('button', { name: 'Skjul ingredienslista' }).click();
  await expect(mode.getByRole('heading', { name: /Steg 2 av/ })).toBeVisible();
});
