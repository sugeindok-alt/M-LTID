import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDatabase } from './database';
import { createAuth } from '@/lib/auth';
import { createLibrary } from '@/lib/library';
import { account, user, verification } from '@/db/schema';
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
    await database.db.update(verification).set({ expiresAt: new Date(0) });
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
  });
});
