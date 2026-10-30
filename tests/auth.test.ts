import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { and, eq, like } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { testDatabase } from './database';
import { createAuth } from '@/lib/auth';
import { createLibrary } from '@/lib/library';
import { account, user, verification, emailRecords } from '@/db/schema';
import { authErrorMessage, emailRequestFeedback } from '@/lib/auth-feedback';
import { normalizeRecipe } from '@/lib/recipes';
import type { Mail } from '@/lib/email';
import { rawMeal } from './fixtures';
import { POST as authRoute } from '@/app/api/auth/[...all]/route';
let database: Awaited<ReturnType<typeof testDatabase>>;
let auth: ReturnType<typeof createAuth>;
const outbox: Mail[] = [];
const origin = 'http://localhost:3000';
const email = 'cook@example.test';
const password = 'strong-password-123';
let cookie = '';
let userId = '';
let nextIP = 1;
async function call(path: string, data?: unknown, cookies = '', ip?: string) {
  return auth.handler(
    new Request(`${origin}/api/auth/${path}`, {
      method: data ? 'POST' : 'GET',
      headers: {
        origin,
        'Content-Type': 'application/json',
        'x-real-ip': ip || `198.51.100.${nextIP++}`,
        ...(cookies ? { cookie: cookies } : {}),
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
    }),
  );
}
function sessionCookie(response: Response) {
  return response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ');
}
beforeAll(async () => {
  database = await testDatabase();
  auth = createAuth(database.db, {
    baseURL: origin,
    secret: 'test-only-secret-32-characters-or-longer-no-production',
    transport: async (mail) => {
      outbox.push(mail);
      return { id: `test-${outbox.length}`, local: true };
    },
  });
});
afterAll(async () => {
  await database?.client.close();
});
describe('Better Auth against migrated PostgreSQL, no external mail', () => {
  it('registers with a hashed password and sends a verifiable link', async () => {
    const response = await call('sign-up/email', {
      name: 'Cook',
      email,
      password,
      callbackURL: '/profil',
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    userId = data.user.id;
    const [row] = await database.db.select().from(account).where(eq(account.userId, userId));
    expect(row.password).toBeTruthy();
    expect(row.password).not.toBe(password);
    expect(outbox.filter((m) => m.kind === 'verification')).toHaveLength(1);
    expect(outbox[0].text).toContain('/verify-email?token=');
  });
  it('blocks login before email verification', async () => {
    expect((await call('sign-in/email', { email, password })).status).toBe(403);
  });
  it('rejects invalid verification tokens', async () => {
    const response = await call('verify-email?token=invalid');
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
  it('verifies email, creates a session and sends a welcome email', async () => {
    const url = outbox
      .find((m) => m.kind === 'verification')!
      .text.split('\n')
      .at(-1)!;
    const response = await auth.handler(new Request(url, { headers: { origin } }));
    expect([200, 302]).toContain(response.status);
    cookie = sessionCookie(response);
    expect(cookie).toContain('session_token');
    const [row] = await database.db.select().from(user).where(eq(user.id, userId));
    expect(row.emailVerified).toBe(true);
    expect(outbox.some((m) => m.kind === 'welcome')).toBe(true);
    const session = await (await call('get-session', undefined, cookie)).json();
    expect(session.user.email).toBe(email);
  });
  it('persists a favorite through logout and login with a fresh session', async () => {
    await createLibrary(database.db).saveFavorite(userId, normalizeRecipe(rawMeal));
    const logout = await call('sign-out', {}, cookie);
    expect(logout.status).toBe(200);
    expect(await (await call('get-session', undefined, cookie)).json()).toBeNull();
    const login = await call('sign-in/email', { email, password });
    expect(login.status).toBe(200);
    cookie = sessionCookie(login);
    const session = await (await call('get-session', undefined, cookie)).json();
    expect(await createLibrary(database.db).favorites(session.user.id)).toHaveLength(1);
  });
  it('rejects replayed verification links without creating a new session', async () => {
    const url = outbox
      .find((m) => m.kind === 'verification')!
      .text.split('\n')
      .at(-1)!;
    const response = await auth.handler(new Request(url));
    expect(response.headers.get('location')).toContain('error=INVALID_TOKEN');
    expect(sessionCookie(response)).not.toContain('session_token');
  });
  it('sends a replacement link and rejects expired verification links', async () => {
    const secondEmail = 'unverified@example.test';
    await call('sign-up/email', { name: 'Other Cook', email: secondEmail, password });
    const first = outbox.findLast((m) => m.to === secondEmail && m.kind === 'verification')!;
    const url = new URL(first.text.split('\n').at(-1)!);
    const tokenId = `email-link:${createHash('sha256').update(url.searchParams.get('token')!).digest('hex')}`;
    await database.db
      .update(verification)
      .set({ expiresAt: new Date(0) })
      .where(eq(verification.id, tokenId));
    url.searchParams.delete('callbackURL');
    expect((await auth.handler(new Request(url))).status).toBe(400);
    // JWTs issued in the same second are identical; move the clock for resend.
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 2000);
    try {
      expect((await call('send-verification-email', { email: secondEmail })).status).toBe(200);
    } finally {
      vi.restoreAllMocks();
    }
    const replacement = outbox.findLast((m) => m.to === secondEmail && m.kind === 'verification')!;
    expect(replacement.key).not.toBe(first.key);
  });
  it('does not expose account existence when email delivery fails or is throttled', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failedAuth = createAuth(database.db, {
      baseURL: origin,
      secret: 'test-only-secret-32-characters-or-longer-no-production',
      transport: async () => {
        throw new Error('provider-private-details');
      },
    });
    const request = (address: string) =>
      failedAuth.handler(
        new Request(`${origin}/api/auth/request-password-reset`, {
          method: 'POST',
          headers: {
            origin,
            'content-type': 'application/json',
            'x-real-ip': `198.51.100.${nextIP++}`,
          },
          body: JSON.stringify({ email: address, redirectTo: '/nytt-passord' }),
        }),
      );
    try {
      const known = await request('unverified@example.test');
      const unknown = await request('unknown@example.test');
      expect(known.status).toBe(unknown.status);
      expect(await known.json()).toEqual(await unknown.json());
      expect(
        await database.db.select().from(emailRecords).where(eq(emailRecords.status, 'failed')),
      ).toHaveLength(1);
      expect(JSON.stringify(log.mock.calls)).not.toContain('provider-private-details');
      expect(emailRequestFeedback).toContain('stadfestar vi ikkje');
      expect(authErrorMessage('PRIVATE_PROVIDER_ERROR')).not.toContain('PRIVATE_PROVIDER');
    } finally {
      log.mockRestore();
    }
  });
  it('does not authenticate a wrong password or forged session', async () => {
    expect((await call('sign-in/email', { email, password: 'incorrect-password' })).status).toBe(
      401,
    );
    expect(
      await (await call('get-session', undefined, 'better-auth.session_token=forged')).json(),
    ).toBeNull();
  });
  it('returns a generic reset response for unknown accounts', async () => {
    const before = outbox.length;
    const response = await call('request-password-reset', {
      email: 'missing@example.test',
      redirectTo: '/nytt-passord',
    });
    expect(response.status).toBe(200);
    expect(outbox.length).toBe(before);
  });
  it('resets with an expiring single-use token and revokes existing sessions', async () => {
    const request = await call('request-password-reset', { email, redirectTo: '/nytt-passord' });
    expect(request.status).toBe(200);
    const mail = outbox.findLast((m) => m.kind === 'reset')!;
    expect(mail).toBeDefined();
    const url = mail.text.split('\n').at(-1)!;
    const token = new URL(url).pathname.split('/').at(-1)!;
    const reset = await call('reset-password', { newPassword: 'new-strong-password-456', token });
    expect(reset.status).toBe(200);
    expect(await (await call('get-session', undefined, cookie)).json()).toBeNull();
    expect((await call('sign-in/email', { email, password })).status).toBe(401);
    expect(
      (await call('sign-in/email', { email, password: 'new-strong-password-456' })).status,
    ).toBe(200);
    expect(
      (await call('reset-password', { newPassword: 'another-password-789', token })).status,
    ).toBeGreaterThanOrEqual(400);
  });
  it('rejects expired password-reset tokens', async () => {
    await call('request-password-reset', { email, redirectTo: '/nytt-passord' });
    const url = outbox
      .findLast((m) => m.kind === 'reset')!
      .text.split('\n')
      .at(-1)!;
    const token = new URL(url).pathname.split('/').at(-1)!;
    await database.db
      .update(verification)
      .set({ expiresAt: new Date(0) })
      .where(
        and(eq(verification.value, userId), like(verification.identifier, 'reset-password:%')),
      );
    expect(
      (await call('reset-password', { newPassword: 'another-password-789', token })).status,
    ).toBeGreaterThanOrEqual(400);
  });
  it('enforces authentication rate limits and rejects untrusted origins', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 8; i++)
      statuses.push(
        (await call('sign-in/email', { email, password: 'incorrect-password' }, '', '203.0.113.5'))
          .status,
      );
    expect(statuses).toContain(429);
    // Exercise the actual app route, including its unconditional origin check.
    const response = await authRoute(
      new Request(`${origin}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { origin: 'https://evil.example', 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }),
    );
    expect(response.status).toBe(403);
    const oversized = await authRoute(
      new Request(`${origin}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { origin, 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'a'.repeat(17000) }),
      }),
    );
    expect(oversized.status).toBe(413);
    expect(oversized.headers.get('cache-control')).toBe('private, no-store');
  });
});
