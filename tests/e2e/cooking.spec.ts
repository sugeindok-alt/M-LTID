import { test, expect } from '@playwright/test';

test('guest cooks salmon on mobile and resumes the step and real time remaining', async ({
  page,
  context,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'This flow uses the mobile layout.');
  const path = '/oppskrifter/nn-laks';
  const started = new Date('2026-11-03T17:00:00Z');
  const later = new Date(started.getTime() + 67_000);
  await page.clock.setFixedTime(started);
  await page.goto(path);
  await page.getByRole('combobox', { name: 'Porsjonar' }).selectOption('0.5');
  await page.getByRole('button', { name: 'Start matlaging', exact: true }).click();
  const mode = page.getByRole('dialog');
  await expect(mode.getByRole('heading', { name: 'Steg 1 av 4' })).toBeVisible();
  await expect(mode.getByRole('button', { name: 'Førre' })).toBeDisabled();
  await mode.getByRole('button', { name: 'Neste' }).click();
  await expect(mode.getByText(/Steik potetene i 20 minutt/)).toBeVisible();
  await mode.getByRole('button', { name: 'Start nedteljing' }).click();
  await expect(mode.getByRole('timer')).toHaveText('20:00');
  await mode.getByRole('button', { name: 'Vis ingredienslista' }).click();
  await expect(mode.getByRole('listitem').filter({ hasText: 'poteter' })).toContainText('400 g');
  await page.clock.setFixedTime(later);
  await expect(mode.getByRole('timer')).toHaveText('18:53');
  await page.reload();
  await expect(mode.getByRole('heading', { name: 'Steg 2 av 4' })).toBeVisible();
  await expect(mode.getByRole('timer')).toHaveText('18:53');
  await page.screenshot({ path: '.local/cooking-mobile.png' });
  for (const name of ['Førre', 'Neste']) {
    const button = mode.getByRole('button', { name, exact: true });
    await expect(button).toBeInViewport({ ratio: 1 });
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  }
  await mode.getByRole('button', { name: 'Neste' }).click();
  await expect(mode.getByRole('heading', { name: 'Steg 3 av 4' })).toBeVisible();
  await page.close();

  const again = await context.newPage();
  await again.clock.setFixedTime(later);
  await again.goto('/oppskrifter/nn-torsk');
  await expect(again.getByRole('button', { name: 'Start matlaging', exact: true })).toBeVisible();
  await again.goto(path);
  await again.getByRole('button', { name: 'Hald fram frå steg 3' }).click();
  const resumed = again.getByRole('dialog');
  await expect(resumed.getByRole('timer')).toHaveText('18:53');
  await resumed.getByRole('button', { name: 'Stopp nedteljinga' }).click();
  const select = resumed.getByRole('combobox', { name: 'Vel tid' });
  await expect(select.locator('option')).toHaveText([
    '12 minutt',
    '13 minutt',
    '14 minutt',
    '15 minutt',
  ]);
  await select.selectOption('840');
  await resumed.getByRole('button', { name: 'Start nedteljing' }).click();
  await expect(resumed.getByRole('timer')).toHaveText('14:00');
  await again.clock.setFixedTime(new Date(later.getTime() + 15 * 60_000));
  await expect(resumed.getByRole('status')).toHaveText('Tida er ute.');
  await resumed.getByRole('button', { name: 'Tilbake til oppskrifta' }).click();
  await again.getByRole('button', { name: 'Start på nytt' }).click();
  await expect(resumed.getByRole('heading', { name: 'Steg 1 av 4' })).toBeVisible();
  await expect(resumed.getByRole('timer')).toHaveCount(0);
  await again.close();
});
