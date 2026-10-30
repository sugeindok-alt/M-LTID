import { afterAll, expect, it, vi } from 'vitest';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { testDatabase } from './database';
import { rawMeal } from './fixtures';
import { normalizeRecipe } from '@/lib/recipes';
import { createFirebaseAuth, firebaseConfigured } from '@/lib/firebase-auth';

const services = vi.hoisted(() => ({ db: undefined as unknown, auth: undefined as unknown }));
vi.mock('@/db', async (original) => ({ ...(await original<object>()), getDb: () => services.db }));
vi.mock('@/lib/firebase-auth', async (original) => ({
  ...(await original<object>()),
  getFirebaseAuth: () => services.auth,
}));
vi.mock('@/lib/catalog', () => ({ currentRecipe: async () => normalizeRecipe(rawMeal) }));
import { GET, POST } from '@/app/api/library/[resource]/route';

afterAll(() => vi.unstubAllEnvs());
it('fails closed when production credentials are missing or emulator is enabled', () => {
  vi.stubEnv('AUTH_PROVIDER', 'firebase');
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('BETTER_AUTH_URL', 'https://m-ltid.vercel.app');
  vi.stubEnv('DATABASE_URL', 'test');
  vi.stubEnv('FIREBASE_PROJECT_ID', 'demo-maltid');
  vi.stubEnv('FIREBASE_API_KEY', 'test-key');
  vi.stubEnv('FIREBASE_SERVICE_ACCOUNT', '');
  expect(firebaseConfigured()).toBe(false);
  vi.stubEnv('FIREBASE_AUTH_EMULATOR_HOST', '127.0.0.1:9099');
  expect(firebaseConfigured()).toBe(false);
  vi.unstubAllEnvs();
});

it.skipIf(!process.env.FIREBASE_AUTH_EMULATOR_HOST)(
  'Firebase emulator: verification, private persistent favourites, reset and revoked sessions',
  async () => {
    const host = process.env.FIREBASE_AUTH_EMULATOR_HOST!;
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) throw new Error('Local emulator required');
    vi.stubEnv('AUTH_PROVIDER', 'firebase');
    vi.stubEnv('BETTER_AUTH_URL', 'https://m-ltid.vercel.app');
    const origin = 'https://m-ltid.vercel.app';
    const db = await testDatabase();
    const app = initializeApp({ projectId: 'demo-maltid' }, `test-${Date.now()}`);
    const pending: Array<() => Promise<void>> = [];
    const auth = createFirebaseAuth({
      db: db.db,
      admin: getAuth(app),
      apiKey: 'demo-key',
      baseURL: origin,
      emulatorHost: host,
      schedule: (task) => pending.push(task),
    });
    services.db = db.db;
    services.auth = auth;
    const suffix = Date.now();
    const alice = `alice-${suffix}@example.test`,
      bob = `bob-${suffix}@example.test`;
    const password = 'Only-a-local-test-12345';
    const headers = (cookie = '', ip = '192.0.2.1') => ({
      origin,
      cookie,
      'content-type': 'application/json',
      'x-real-ip': ip,
    });
    const post = (path: string, data: object, cookie = '', ip?: string) =>
      auth.handler(
        new Request(`${origin}/api/auth/${path}`, {
          method: 'POST',
          headers: headers(cookie, ip),
          body: JSON.stringify(data),
        }),
      );
    const cookieOf = (r: Response) =>
      r.headers
        .getSetCookie()
        .map((c) => c.split(';')[0])
        .join('; ');
    const drain = async () => {
      while (pending.length) await pending.shift()!();
    };
    const lastCode = async (email: string, type: string) => {
      const result = await (
        await fetch(`http://${host}/emulator/v1/projects/demo-maltid/oobCodes`)
      ).json();
      return result.oobCodes
        .filter(
          (v: { email: string; requestType: string }) =>
            v.email === email && v.requestType === type,
        )
        .at(-1).oobCode as string;
    };
    const context = { params: Promise.resolve({ resource: 'favorites' }) };
    const library = (cookie: string, data?: object) =>
      new Request(`${origin}/api/library/favorites?userId=forged`, {
        method: data ? 'POST' : 'GET',
        headers: headers(cookie),
        ...(data ? { body: JSON.stringify(data) } : {}),
      });
    try {
      expect((await GET(library(''), context)).status).toBe(401);
      for (const [email, ip] of [
        [alice, '192.0.2.1'],
        [bob, '192.0.2.2'],
      ]) {
        expect(
          (await post('sign-up/email', { email, password, name: 'Testbrukar' }, '', ip)).status,
        ).toBe(200);
        await drain();
        expect((await post('sign-in/email', { email, password }, '', ip)).status).toBe(403);
        const token = await lastCode(email, 'VERIFY_EMAIL');
        expect((await post('verify-email', { token }, '', ip)).status).toBe(200);
        expect((await post('verify-email', { token }, '', ip)).status).toBe(400);
      }
      const login = await post('sign-in/email', { email: alice, password });
      expect(login.status).toBe(200);
      expect(login.headers.get('set-cookie')).toMatch(/HttpOnly; SameSite=Lax.*Secure/);
      let a = cookieOf(login);
      const b = cookieOf(await post('sign-in/email', { email: bob, password }, '', '192.0.2.2'));
      const save = { recipeId: String(rawMeal.idMeal), saved: true, userId: 'forged' };
      expect((await POST(library(a, save), context)).status).toBe(200);
      expect((await POST(library(a, save), context)).status).toBe(200);
      expect((await (await GET(library(b), context)).json()).recipes).toHaveLength(0);
      expect((await POST(library(b, { ...save, saved: false }), context)).status).toBe(200);
      expect((await post('sign-out', {}, a)).status).toBe(200);
      expect(await auth.getSession(new Headers({ cookie: a }))).toBeNull();
      a = cookieOf(await post('sign-in/email', { email: alice, password }));
      expect((await (await GET(library(a), context)).json()).recipes).toHaveLength(1);
      expect((await post('request-password-reset', { email: alice })).status).toBe(200);
      await drain();
      const reset = await lastCode(alice, 'PASSWORD_RESET');
      // Firebase's revocation timestamp has second precision.
      await new Promise((resolve) => setTimeout(resolve, 1100));
      expect(
        (await post('reset-password', { token: reset, newPassword: `${password}-new` })).status,
      ).toBe(200);
      expect(await auth.getSession(new Headers({ cookie: a }))).toBeNull();
      expect((await post('reset-password', { token: reset, newPassword: password })).status).toBe(
        400,
      );
      expect(
        (await post('reset-password', { token: 'invalid', newPassword: password })).status,
      ).toBe(400);
      expect((await post('sign-in/email', { email: alice, password })).status).toBe(400);
      const fresh = await post('sign-in/email', { email: alice, password: `${password}-new` });
      expect(fresh.status).toBe(200);
      expect((await (await GET(library(cookieOf(fresh)), context)).json()).recipes).toHaveLength(1);
      expect(
        (
          await auth.handler(
            new Request(`${origin}/api/auth/sign-out`, {
              method: 'POST',
              headers: { origin: 'https://evil.example' },
              body: '{}',
            }),
          )
        ).status,
      ).toBe(403);
    } finally {
      await deleteApp(app);
      await db.client.close();
      vi.unstubAllEnvs();
    }
  },
  30000,
);
