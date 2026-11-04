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
import { GET, POST, PATCH } from '@/app/api/library/[resource]/route';
import { GET as readPhoto } from '@/app/api/kokebok/[id]/bilete/route';
import sharp from 'sharp';
import { eq } from 'drizzle-orm';
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
async function login(email: string, testIp = '198.51.100.10') {
  return auth.handler(
    new Request(`${origin}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json', 'x-real-ip': testIp },
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
  it('keeps personal recipes, photos and calendar choices private, including after a fresh login', async () => {
    const id = crypto.randomUUID(),
      ctx = { params: Promise.resolve({ resource: 'cookbook' }) };
    const photoCtx = { params: Promise.resolve({ id }) };
    const get = (cookie: string, query = '') =>
      GET(new Request(origin + '/api/library/cookbook' + query, { headers: { cookie } }), ctx);
    const original = async () =>
      (await database.db.select().from(recipeCatalog).where(eq(recipeCatalog.id, 'nn-laks')))[0]
        .data;
    const before = await original();
    const data = {
      id,
      title: before.title,
      ingredients: [{ name: 'poteter', measure: '320 g' }],
      servings: 2,
      steps: ['Del potetene.'],
      originalId: before.id,
      image:
        'data:image/jpeg;base64,' +
        (
          await sharp({ create: { width: 2, height: 2, channels: 3, background: 'green' } })
            .jpeg()
            .toBuffer()
        ).toString('base64'),
    };
    expect((await POST(request('', data), ctx)).status).toBe(401);
    expect((await POST(request(alice, data), ctx)).status).toBe(200);
    expect(
      (
        await POST(
          request(bob, {
            ...data,
            id: crypto.randomUUID(),
            originalId: null,
            image: null,
            title: 'Berre min gryterett',
          }),
          ctx,
        )
      ).status,
    ).toBe(200);
    const secondDevice = await login('alice-api@example.test', '198.51.100.20');
    expect(secondDevice.status).toBe(200);
    const fresh = cookies(secondDevice);
    const row = await (await get(fresh, '?id=' + id)).json();
    expect(row).toMatchObject({
      originalTitle: before.title,
      hasImage: true,
      revision: 1,
      servings: 2,
    });
    const update = {
      id,
      title: 'Laks med mindre poteter',
      ingredients: row.ingredients,
      servings: 2,
      steps: ['Skjer potetene i båtar.'],
      revision: 1,
    };
    expect((await PATCH(request(bob, update), ctx)).status).toBe(404);
    expect((await PATCH(request(fresh, update), ctx)).status).toBe(200);
    expect((await PATCH(request(fresh, update), ctx)).status).toBe(409);
    expect(await (await get(fresh, '?id=' + id)).json()).toMatchObject({
      revision: 2,
      hasImage: true,
      steps: update.steps,
    });
    expect((await get(bob, '?id=' + id)).status).toBe(404);
    expect((await (await get(bob)).json()).recipes.map((r: { title: string }) => r.title)).toEqual([
      'Berre min gryterett',
    ]);
    expect((await readPhoto(request(bob), photoCtx)).status).toBe(404);
    expect((await readPhoto(request(''), photoCtx)).status).toBe(401);
    const photo = await readPhoto(request(fresh), photoCtx);
    expect(photo.headers.get('cache-control')).toBe('private, no-store');
    expect(photo.headers.get('content-type')).toBe('image/webp');
    expect((await sharp(Buffer.from(await photo.arrayBuffer())).metadata()).format).toBe('webp');
    const week = { params: Promise.resolve({ resource: 'week' }) },
      day = { week: '2026-11-16', day: 2, recipeId: id, servings: 4 };
    expect((await POST(request(bob, day), week)).status).toBe(404);
    const plan = await (await POST(request(fresh, day), week)).json();
    expect(plan.days[0].title).toContain('Min variant');
    expect(plan.items).toContainEqual({ name: 'poteter', measure: '640 g' });
    expect(await original()).toEqual(before);
  });
  it('keeps independent weeks across login and imports the scaled preview exactly once', async () => {
    const week = '2026-11-02';
    const planner = cookies(await register('planner-api@example.test'));
    const weekCtx = { params: Promise.resolve({ resource: 'week' }) };
    const importCtx = { params: Promise.resolve({ resource: 'week-shopping' }) };
    const snapshot = async (cookie: string) =>
      GET(new Request(origin + '/api/library/week?week=' + week, { headers: { cookie } }), weekCtx);
    const change = (cookie: string, day: number, recipeId: string | null, servings: number) =>
      POST(request(cookie, { week, day, recipeId, servings }), weekCtx);
    expect((await snapshot('')).status).toBe(401);
    expect((await change(planner, 0, 'nn-fiskekaker', 2)).status).toBe(200);
    const preview = await (await change(planner, 1, 'nn-torsk-med-eggesmor', 4)).json();
    expect(
      preview.items.find((i: { name: string }) => i.name === 'poteter').measure.replace(/\s/g, ''),
    ).toBe('1200g');
    expect((await (await snapshot(bob)).json()).days).toEqual([]);
    await change(bob, 0, 'nn-taco', 3);
    await change(bob, 1, null, 4);
    const fresh = cookies(await login('planner-api@example.test'));
    expect((await (await snapshot(fresh)).json()).days).toEqual(preview.days);
    expect((await (await snapshot(bob)).json()).days[0].recipeId).toBe('nn-taco');
    const changed = await (await change(planner, 1, 'nn-torsk-med-eggesmor', 2)).json();
    expect(
      (await POST(request(planner, { week, version: preview.version }), importCtx)).status,
    ).toBe(409);
    expect((await (await change(planner, 1, 'nn-torsk-med-eggesmor', 4)).json()).version).not.toBe(
      changed.version,
    );
    const post = (cookie: string) =>
      POST(request(cookie, { week, version: preview.version }), importCtx);
    expect((await Promise.all([post(planner), post(fresh)])).map((r) => r.status)).toEqual([
      200, 200,
    ]);
    expect((await (await snapshot(fresh)).json()).imported).toBe(true);
    const shopping = { params: Promise.resolve({ resource: 'shopping' }) };
    const rows = (await (await GET(request(planner), shopping)).json()).items;
    expect(rows.filter((i: { name: string }) => i.name === 'poteter')).toMatchObject([
      { amount: 1200, unit: 'g' },
    ]);
    expect((await (await GET(request(bob), shopping)).json()).items).toHaveLength(0);
    expect((await change(planner, 0, null, 4)).status).toBe(200);
    expect((await (await snapshot(fresh)).json()).days.map((d: { day: number }) => d.day)).toEqual([
      1,
    ]);
    expect((await change(planner, 7, 'nn-laks', 2)).status).toBe(400);
  });
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
