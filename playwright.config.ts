import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        defaultBrowserType: 'chromium',
        channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
      },
    },
  ],
  webServer: {
    command:
      process.env.PLAYWRIGHT_PRODUCTION === '1'
        ? 'npm run start -- --hostname 127.0.0.1'
        : 'npm run dev -- --hostname 127.0.0.1',
    url: 'http://127.0.0.1:3000',
    env: { BETTER_AUTH_URL: 'http://127.0.0.1:3000' },
    reuseExistingServer: !process.env.CI && process.env.PLAYWRIGHT_PRODUCTION !== '1',
    timeout: 120000,
  },
});
