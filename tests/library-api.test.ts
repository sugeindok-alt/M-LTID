import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { testDatabase } from './database';
import { createAuth } from '@/lib/auth';
import { rawMeal } from './fixtures';
import type { Mail } from '@/lib/email';
import { catalogSnapshot } from '@/data/catalog';
import { recipeCatalog } from '@/db/schema';

const services = vi.hoisted(() => ({ db: undefined as unknown, auth: undefined as unknown }));
vi.mock('@/db', async (original) => ({ ...(await original<object>()), getDb: () => services.db }));
vi.mock('@/lib/auth', async (original) => ({
  ...(await original<object>()),
  getAuth: () => services.auth,
}));
import { GET, POST } from '@/app/api/library/[resource]/route';
const origin = 'https://m-ltid.vercel.app';
const outbox: Mail[] = [];
let database: Awaited<ReturnType<typeof testDatabase>>;
let auth: ReturnType<typeof createAuth>;
let alice = '',
  bob = '';
const cookies = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((v) => v.split(';')[0])
    .join('; ');
async function login(email: string) {
  return auth.handler(
    new Request(`${origin}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify({ email, password: 'test-password-12345' }),
    }),
  );
}
async function register(email: string) {
  await auth.handler(
    new Request(`${origin}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Test Cook', email, password: 'test-password-12345' }),
    }),
  );
  const url = outbox
    .find((m) => m.to === email && m.kind === 'verification')!
    .text.split('\n')
    .at(-1)!;
  await auth.handler(new Request(url));
  return login(email);
}
const context = { params: Promise.resolve({ resource: 'favorites' }) };
const request = (cookie: string, data?: unknown, requestOrigin = origin) =>
  new Request(`${origin}/api/library/favorites?userId=someone-else`, {
    method: data ? 'POST' : 'GET',
    headers: { cookie, origin: requestOrigin, 'content-type': 'application/json' },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
beforeAll(async () => {
  vi.stubEnv('BETTER_AUTH_URL', origin);
  database = await testDatabase();
  services.db = database.db;
  await database.db
    .insert(recipeCatalog)
    .values(catalogSnapshot.map((data) => ({ id: data.id, data })));
  auth = createAuth(database.db, {
    baseURL: origin,
    secret: 'test-secret-at-least-32-characters-long-and-not-production',
    transport: async (mail) => {
      outbox.push(mail);
      return { id: `test-${outbox.length}`, local: true };
    },
  });
  services.auth = auth;
  const response = await register('alice-api@example.test');
  alice = cookies(response);
  expect(response.headers.getSetCookie().join(';')).toMatch(/Secure/);
  expect(response.headers.getSetCookie().join(';')).toMatch(/HttpOnly/);
  expect(response.headers.getSetCookie().join(';')).toMatch(/SameSite=Lax/i);
  bob = cookies(await register('bob-api@example.test'));
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await database?.client.close();
});
describe('real sessions through the favorites API', () => {
  it('saves a new catalogue ID and scales Norwegian shopping quantities without cross-account access', async () => {
    const saved = await POST(request(alice, { recipeId: 'nn-laks', saved: true }), context);
    expect(saved.status).toBe(200);
    const fresh = await login('alice-api@example.test');
    const a = cookies(fresh);
    expect(
      (await (await GET(request(a), context)).json()).recipes.some(
        (r: { id: string }) => r.id === 'nn-laks',
      ),
    ).toBe(true);
    expect((await (await GET(request(bob), context)).json()).recipes).toEqual([]);
    await POST(request(bob, { recipeId: 'nn-laks', saved: false }), context);
    expect(
      (await (await GET(request(a), context)).json()).recipes.some(
        (r: { id: string }) => r.id === 'nn-laks',
      ),
    ).toBe(true);
    const shopping = { params: Promise.resolve({ resource: 'shopping' }) };
    expect(
      (
        await POST(
          request(a, { recipeId: 'nn-laks', requestId: crypto.randomUUID(), scale: 0.5 }),
          shopping,
        )
      ).status,
    ).toBe(200);
    const items = (await (await GET(request(a), shopping)).json()).items;
    expect(items.find((i: { name: string }) => i.name === 'laksefilet').amount).toBe(300);
    await POST(request(a, { recipeId: 'nn-laks', saved: false }), context);
  });
  it('rejects missing, forged and unverified sessions', async () => {
    expect((await GET(request(''), context)).status).toBe(401);
    expect((await GET(request('__Secure-better-auth.session_token=forged'), context)).status).toBe(
      401,
    );
    const session = await auth.api.getSession({ headers: new Headers({ cookie: alice }) });
    const { user } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    await database.db
      .update(user)
      .set({ emailVerified: false })
      .where(eq(user.id, session!.user.id));
    expect((await GET(request(alice), context)).status).toBe(403);
    await database.db
      .update(user)
      .set({ emailVerified: true })
      .where(eq(user.id, session!.user.id));
  });
  it('keeps favorites across fresh sessions, ignores forged ownership, prevents duplicates', async () => {
    const save = { recipeId: String(rawMeal.idMeal), saved: true, userId: 'someone-else' };
    expect((await POST(request(alice, save), context)).status).toBe(200);
    expect((await POST(request(alice, save), context)).status).toBe(200);
    const freshCookie = cookies(await login('alice-api@example.test'));
    expect((await (await GET(request(freshCookie), context)).json()).recipes).toHaveLength(1);
    expect((await (await GET(request(bob), context)).json()).recipes).toHaveLength(0);
    expect((await POST(request(bob, { ...save, saved: false }), context)).status).toBe(200);
    expect((await (await GET(request(alice), context)).json()).recipes).toHaveLength(1);
  });
  it('rejects cross-origin mutations and does not cache personal data', async () => {
    expect(
      (
        await POST(
          request(
            alice,
            { recipeId: String(rawMeal.idMeal), saved: false },
            'https://evil.example',
          ),
          context,
        )
      ).status,
    ).toBe(403);
    expect((await GET(request(alice), context)).headers.get('cache-control')).toBe(
      'private, no-store',
    );
  });
});
