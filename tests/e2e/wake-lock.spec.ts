import { test, expect, type Page } from '@playwright/test';

declare global {
  interface Window {
    wakeTest: {
      requests: number;
      releases: number;
      delayed: boolean;
      denied: boolean;
      visibility: DocumentVisibilityState;
      resolve: Array<() => void>;
    };
  }
}

async function mockWakeLock(page: Page, mode = 'normal') {
  await page.addInitScript((mode) => {
    const state = (window.wakeTest = {
      requests: 0,
      releases: 0,
      delayed: mode === 'delayed',
      denied: mode === 'denied',
      visibility: 'visible' as DocumentVisibilityState,
      resolve: [] as Array<() => void>,
    });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => state.visibility,
    });
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value:
        mode === 'unsupported'
          ? undefined
          : {
              request: async () => {
                state.requests++;
                if (state.denied) throw new Error('Wake lock denied in test');
                const lock = {
                  released: false,
                  release: async () => {
                    if (!lock.released) {
                      lock.released = true;
                      state.releases++;
                    }
                  },
                };
                if (state.delayed)
                  await new Promise<void>((resolve) => state.resolve.push(resolve));
                return lock;
              },
            },
    });
  }, mode);
  await page.goto('/oppskrifter/nn-laks');
  await page.getByRole('button', { name: 'Start matlaging', exact: true }).click();
}

test('wake lock follows the dialog and reacquires when the page becomes visible', async ({
  page,
}) => {
  await mockWakeLock(page);
  await expect.poll(() => page.evaluate(() => window.wakeTest.requests)).toBe(1);
  await page.getByRole('button', { name: 'Vis ingredienslista' }).click();
  expect(await page.evaluate(() => window.wakeTest.requests)).toBe(1);
  await page.evaluate(() => {
    window.wakeTest.visibility = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => window.wakeTest.releases)).toBe(1);
  await page.evaluate(() => {
    window.wakeTest.visibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => window.wakeTest.requests)).toBe(2);
  await page.getByRole('button', { name: 'Tilbake til oppskrifta' }).click();
  await expect.poll(() => page.evaluate(() => window.wakeTest.releases)).toBe(2);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(await page.evaluate(() => window.wakeTest.requests)).toBe(2);
});

test('a pending wake lock is released if the dialog closes before it is granted', async ({
  page,
}) => {
  await mockWakeLock(page, 'delayed');
  await expect.poll(() => page.evaluate(() => window.wakeTest.requests)).toBe(1);
  await page.getByRole('button', { name: 'Tilbake til oppskrifta' }).click();
  await page.evaluate(() => window.wakeTest.resolve.forEach((resolve) => resolve()));
  await expect.poll(() => page.evaluate(() => window.wakeTest.releases)).toBe(1);
});

for (const mode of ['unsupported', 'denied'])
  test(`cooking still works when wake lock is ${mode}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await mockWakeLock(page, mode);
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Neste', exact: true }).click();
    await expect(dialog.getByRole('heading', { name: 'Steg 2 av 4' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Start nedteljing' }).click();
    await expect(dialog.getByRole('timer')).toHaveText(/^(19:|20:)/);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    expect(errors).toEqual([]);
  });
