import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth as adminAuth, type Auth } from 'firebase-admin/auth';
import { and, eq, gt } from 'drizzle-orm';
import { z } from 'zod';
import { after } from 'next/server';
import { getDb, type Database } from '@/db';
import { user, account, session, emailRecords as emailSendRecords } from '@/db/schema';
import { AppError } from './errors';
import { consumeLimit } from './rate-limit';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const lifetime = 7 * 24 * 60 * 60;
const email = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((v) => v.toLowerCase());
const password = z.string().min(10).max(128);
const credentials = z.object({ email, password: z.string().min(1).max(128) });
const code = z.string().min(1).max(2048);

export function firebaseConfigured() {
  try {
    const url = new URL(process.env.BETTER_AUTH_URL || '');
    const emulator = process.env.FIREBASE_AUTH_EMULATOR_HOST;
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/')
      return false;
    if (process.env.NODE_ENV === 'production' && (url.protocol !== 'https:' || emulator))
      return false;
    if (emulator && !process.env.FIREBASE_PROJECT_ID?.startsWith('demo-')) return false;
    if (
      !process.env.DATABASE_URL ||
      !process.env.FIREBASE_API_KEY ||
      !process.env.FIREBASE_PROJECT_ID
    )
      return false;
    if (emulator) return /^(127\.0\.0\.1|localhost):\d+$/.test(emulator);
    const service = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    return Boolean(
      service.private_key &&
      service.client_email &&
      service.project_id === process.env.FIREBASE_PROJECT_ID,
    );
  } catch {
    return false;
  }
}

class FirebaseFailure extends AppError {
  constructor(
    public code: string,
    status = 400,
  ) {
    super('Kontoforespurnaden kunne ikkje fullførast.', status);
  }
}

export function createFirebaseAuth(config: {
  db: Database;
  admin: Auth;
  apiKey: string;
  baseURL: string;
  emulatorHost?: string;
  schedule: (task: () => Promise<void>) => void;
}) {
  const { db, admin } = config;
  const secure = config.baseURL.startsWith('https:');
  const cookieName = secure ? '__Host-maltid-session' : 'maltid-session';
  const root = config.emulatorHost
    ? `http://${config.emulatorHost}/identitytoolkit.googleapis.com/v1`
    : 'https://identitytoolkit.googleapis.com/v1';

  async function api<T>(action: string, data: object): Promise<T> {
    let response: Response;
    try {
      response = await fetch(
        `${root}/accounts:${action}?key=${encodeURIComponent(config.apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Firebase-Locale': 'no' },
          body: JSON.stringify(data),
          cache: 'no-store',
          signal: AbortSignal.timeout(12000),
        },
      );
    } catch {
      throw new FirebaseFailure('SERVICE_UNAVAILABLE', 503);
    }
    const result = await response.json();
    if (!response.ok) {
      const source = String(result.error?.message || '').split(' : ')[0];
      const mapped: Record<string, string> = {
        INVALID_LOGIN_CREDENTIALS: 'INVALID_EMAIL_OR_PASSWORD',
        EMAIL_NOT_FOUND: 'INVALID_EMAIL_OR_PASSWORD',
        INVALID_PASSWORD: 'INVALID_EMAIL_OR_PASSWORD',
        USER_DISABLED: 'INVALID_EMAIL_OR_PASSWORD',
        INVALID_OOB_CODE: 'INVALID_TOKEN',
        EXPIRED_OOB_CODE: 'INVALID_TOKEN',
        TOO_MANY_ATTEMPTS_TRY_LATER: 'TOO_MANY_REQUESTS',
        WEAK_PASSWORD: 'PASSWORD_TOO_SHORT',
      };
      throw new FirebaseFailure(
        mapped[source] || source || 'SERVICE_UNAVAILABLE',
        source === 'TOO_MANY_ATTEMPTS_TRY_LATER' ? 429 : response.status >= 500 ? 503 : 400,
      );
    }
    return result as T;
  }

  const readCookie = (headers: Headers) =>
    headers
      .get('cookie')
      ?.split(';')
      .map((v) => v.trim())
      .find((v) => v.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);
  const cookie = (value: string, maxAge = lifetime) =>
    `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
  const reply = (data: unknown, setCookie?: string) =>
    Response.json(data, {
      headers: {
        'Cache-Control': 'private, no-store',
        ...(setCookie ? { 'Set-Cookie': setCookie } : {}),
      },
    });

  async function getSession(headers: Headers) {
    const token = readCookie(headers);
    if (!token) return null;
    const [stored] = await db
      .select()
      .from(session)
      .where(and(eq(session.token, `firebase:${hash(token)}`), gt(session.expiresAt, new Date())))
      .limit(1);
    if (!stored) return null;
    let identity;
    try {
      // Also rejects sessions revoked by password reset, account disabling or deletion.
      identity = await admin.verifySessionCookie(token, true);
    } catch {
      return null;
    }
    if (!identity.email_verified) return null;
    const [owner] = await db
      .select({ user })
      .from(user)
      .innerJoin(account, eq(account.userId, user.id))
      .where(
        and(
          eq(user.id, stored.userId),
          eq(account.providerId, 'firebase'),
          eq(account.accountId, identity.uid),
        ),
      )
      .limit(1);
    if (!owner) return null;
    return {
      user: owner.user,
      session: { id: stored.id, userId: stored.userId, expiresAt: stored.expiresAt },
    };
  }

  async function signIn(data: z.infer<typeof credentials>) {
    const signed = await api<{ idToken: string }>('signInWithPassword', {
      ...data,
      returnSecureToken: true,
    });
    const identity = await admin.verifyIdToken(signed.idToken, true);
    if (!identity.email_verified) throw new FirebaseFailure('EMAIL_NOT_VERIFIED', 403);
    if (!identity.email || Date.now() / 1000 - identity.auth_time > 300)
      throw new FirebaseFailure('INVALID_EMAIL_OR_PASSWORD', 401);
    const uid = identity.uid;
    const [linked] = await db
      .select({ user })
      .from(account)
      .innerJoin(user, eq(user.id, account.userId))
      .where(and(eq(account.providerId, 'firebase'), eq(account.accountId, uid)))
      .limit(1);
    let owner = linked?.user;
    if (!owner) {
      // Never silently merge a different existing identity by email address.
      // Existing Better Auth rows and their favourites remain untouched.
      await db.transaction(async (tx) => {
        const id = `firebase:${uid}`;
        await tx
          .insert(user)
          .values({
            id,
            email: identity.email!.toLowerCase(),
            emailVerified: true,
            name: String(identity.name || 'Matven').slice(0, 80),
          })
          .onConflictDoNothing();
        const [created] = await tx.select().from(user).where(eq(user.id, id)).limit(1);
        if (!created) throw new FirebaseFailure('ACCOUNT_LINK_REQUIRED', 409);
        await tx
          .insert(account)
          .values({ id: randomUUID(), userId: id, providerId: 'firebase', accountId: uid })
          .onConflictDoNothing();
        owner = created;
      });
    }
    const token = await admin.createSessionCookie(signed.idToken, { expiresIn: lifetime * 1000 });
    const stored = {
      id: randomUUID(),
      userId: owner!.id,
      token: `firebase:${hash(token)}`,
      expiresAt: new Date(Date.now() + lifetime * 1000),
    };
    await db.insert(session).values(stored).onConflictDoNothing();
    return reply({ user: owner, redirect: false }, cookie(token));
  }

  function scheduleMail(kind: string, task: () => Promise<void>) {
    config.schedule(async () => {
      const id = randomUUID();
      try {
        await db
          .insert(emailSendRecords)
          .values({ id, kind: `firebase-${kind}`, idempotencyKey: id, status: 'pending' });
        await task();
        await db
          .update(emailSendRecords)
          .set({ status: 'accepted', updatedAt: new Date() })
          .where(eq(emailSendRecords.id, id));
      } catch {
        // Neither account existence nor provider errors are sent to the caller.
        await db
          .update(emailSendRecords)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(eq(emailSendRecords.id, id))
          .catch(() => {});
        console.error('Firebase account email not confirmed; inspect email_send_records.');
      }
    });
  }

  async function handler(request: Request) {
    try {
      const path = new URL(request.url).pathname.replace(/^\/api\/auth/, '');
      if (request.method === 'GET' && path === '/get-session')
        return reply(await getSession(request.headers));
      if (request.method !== 'POST') return new Response(null, { status: 405 });
      if (request.headers.get('origin') !== new URL(config.baseURL).origin)
        throw new AppError('Ugyldig opphav for førespurnaden.', 403);
      if (Number(request.headers.get('content-length')) > 16000)
        throw new AppError('Førespurnaden er for stor.', 413);
      const raw = await request.text();
      if (raw.length > 16000) throw new AppError('Førespurnaden er for stor.', 413);
      const data: unknown = JSON.parse(raw || '{}');
      const ip = hash(request.headers.get('x-real-ip') || 'unknown');
      await consumeLimit(db, `firebase:ip:${ip}`, 60, 60);
      if (path === '/sign-in/email') {
        const input = credentials.parse(data);
        await consumeLimit(db, `firebase:login:${ip}`, 6, 60);
        await consumeLimit(db, `firebase:login-email:${hash(input.email)}`, 30, 3600);
        return await signIn(input);
      }
      if (path === '/sign-out') {
        const token = readCookie(request.headers);
        if (token) await db.delete(session).where(eq(session.token, `firebase:${hash(token)}`));
        return reply({ success: true }, cookie('', 0));
      }
      if (
        ['/sign-up/email', '/send-verification-email', '/request-password-reset'].includes(path)
      ) {
        const input =
          path === '/sign-up/email'
            ? z.object({ email, password, name: z.string().trim().min(2).max(80) }).parse(data)
            : path === '/send-verification-email'
              ? credentials.parse(data)
              : z.object({ email }).parse(data);
        await consumeLimit(db, `firebase:mail-ip:${ip}`, 8, 3600);
        await consumeLimit(db, `firebase:mail:${hash(input.email)}`, 3, 3600);
        const kind = path === '/request-password-reset' ? 'reset' : 'verification';
        scheduleMail(kind, async () => {
          if (path === '/request-password-reset') {
            await api('sendOobCode', {
              requestType: 'PASSWORD_RESET',
              email: input.email,
              continueUrl: `${config.baseURL}/logg-inn`,
            });
          } else {
            const signed = await api<{ idToken: string }>(
              path === '/sign-up/email' ? 'signUp' : 'signInWithPassword',
              {
                email: input.email,
                password: 'password' in input ? input.password : '',
                returnSecureToken: true,
                ...('name' in input ? { displayName: input.name } : {}),
              },
            );
            await api('sendOobCode', {
              requestType: 'VERIFY_EMAIL',
              idToken: signed.idToken,
              continueUrl: `${config.baseURL}/logg-inn`,
            });
          }
        });
        return reply({ status: true });
      }
      if (path === '/verify-email') {
        const input = z.object({ token: code }).parse(data);
        await api('update', { oobCode: input.token });
        return reply({ status: true });
      }
      if (path === '/reset-password') {
        const input = z.object({ token: code, newPassword: password }).parse(data);
        await api('resetPassword', { oobCode: input.token, newPassword: input.newPassword });
        return reply({ status: true });
      }
      return new Response(null, { status: 404 });
    } catch (error) {
      const status =
        error instanceof AppError
          ? error.status
          : error instanceof z.ZodError || error instanceof SyntaxError
            ? 400
            : 503;
      return Response.json(
        {
          code:
            error instanceof FirebaseFailure
              ? error.code
              : status === 429
                ? 'TOO_MANY_REQUESTS'
                : 'REQUEST_FAILED',
          message: 'Førespurnaden kunne ikkje fullførast. Kontroller felta og prøv igjen.',
        },
        {
          status,
          headers: {
            'Cache-Control': 'private, no-store',
            ...(status === 429 ? { 'Retry-After': '60' } : {}),
          },
        },
      );
    }
  }
  return { handler, getSession };
}

let service: ReturnType<typeof createFirebaseAuth> | undefined;
export function getFirebaseAuth() {
  if (!firebaseConfigured())
    throw new AppError('Innlogginga manglar oppsett. Prøv igjen seinare.', 503);
  if (!service) {
    const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
    const app =
      getApps().find((v) => v.name === 'maltid') ||
      initializeApp(
        {
          projectId: process.env.FIREBASE_PROJECT_ID,
          ...(emulatorHost
            ? {}
            : { credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)) }),
        },
        'maltid',
      );
    service = createFirebaseAuth({
      db: getDb(),
      admin: adminAuth(app),
      apiKey: process.env.FIREBASE_API_KEY!,
      baseURL: process.env.BETTER_AUTH_URL!,
      emulatorHost,
      schedule: (task) => after(task),
    });
  }
  return service;
}
