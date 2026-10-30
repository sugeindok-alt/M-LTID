import { defineConfig } from '@playwright/test';
import { config } from 'dotenv';
config({ path: '.env.local', quiet: true });
if (!process.env.DATABASE_URL || process.env.EMAIL_TRANSPORT !== 'file')
  throw new Error(
    'Authentication browser tests require a separate development database and file email transport.',
  );
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'auth.spec.ts',
  workers: 1,
  timeout: 180000,
  expect: { timeout: 30000 },
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    channel: 'chrome',
    trace: 'off',
    screenshot: 'off',
    video: 'off',
  },
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: false,
    timeout: 120000,
    env: { BETTER_AUTH_URL: 'http://127.0.0.1:3100', EMAIL_TRANSPORT: 'file', RESEND_API_KEY: '' },
    stdout: 'ignore',
    stderr: 'ignore',
  },
});
