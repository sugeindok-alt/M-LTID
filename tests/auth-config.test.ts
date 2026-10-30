import { afterEach, describe, expect, it, vi } from 'vitest';
import { authConfigured } from '@/lib/auth';
afterEach(() => vi.unstubAllEnvs());
function production() {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('DATABASE_URL', 'postgresql://test-only.invalid/database');
  vi.stubEnv('BETTER_AUTH_SECRET', 'test-only-secret-with-at-least-32-characters');
  vi.stubEnv('BETTER_AUTH_URL', 'https://m-ltid.vercel.app');
  vi.stubEnv('RESEND_API_KEY', 'test-only-key');
  vi.stubEnv('RESEND_FROM_EMAIL', 'MÅLTID <mail@example.test>');
}
describe('production configuration guard', () => {
  it('requires https, a strong secret and a root origin', () => {
    production();
    expect(authConfigured()).toBe(true);
    vi.stubEnv('BETTER_AUTH_URL', 'http://m-ltid.vercel.app');
    expect(authConfigured()).toBe(false);
    vi.stubEnv('BETTER_AUTH_URL', 'https://m-ltid.vercel.app/unexpected');
    expect(authConfigured()).toBe(false);
    vi.stubEnv('BETTER_AUTH_URL', 'https://m-ltid.vercel.app');
    vi.stubEnv('BETTER_AUTH_SECRET', 'short');
    expect(authConfigured()).toBe(false);
  });
  it('does not enable public registration with the Resend test domain', () => {
    production();
    vi.stubEnv('RESEND_FROM_EMAIL', 'MÅLTID <onboarding@resend.dev>');
    expect(authConfigured()).toBe(false);
  });
  it('never uses file email as a production fallback', () => {
    production();
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('EMAIL_TRANSPORT', 'file');
    expect(authConfigured()).toBe(false);
  });
});
