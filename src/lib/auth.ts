import 'server-only';
import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { createHash } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { after } from 'next/server';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { getDb, type Database } from '@/db';
import * as schema from '@/db/schema';
import { createMailer, linkMail, type MailTransport } from './email';
import { AppError } from './errors';
import { consumeLimit } from './rate-limit';
export const authConfigured = () => {
  const production = process.env.NODE_ENV === 'production';
  if (!process.env.DATABASE_URL || (process.env.BETTER_AUTH_SECRET?.length ?? 0) < 32) return false;
  try {
    const url = new URL(process.env.BETTER_AUTH_URL || 'http://localhost:3000');
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/')
      return false;
    if (production && url.protocol !== 'https:') return false;
  } catch {
    return false;
  }
  if (production && /@resend\.dev\s*>?\s*$/i.test(process.env.RESEND_FROM_EMAIL || ''))
    return false;
  return Boolean(
    (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) ||
    (process.env.EMAIL_TRANSPORT === 'file' && !production),
  );
};
export function createAuth(
  db: Database,
  config: {
    secret: string;
    baseURL: string;
    transport?: MailTransport;
    schedule?: (task: () => Promise<void>) => void;
  },
) {
  const send = createMailer(db, config.transport);
  const verificationId = (token: string) =>
    `email-link:${createHash('sha256').update(token).digest('hex')}`;
  async function deliverAccountMail(mail: Parameters<typeof send>[0], limitKey: string) {
    try {
      await consumeLimit(db, limitKey, 3, 3600);
      await send(mail);
    } catch {
      // Failure is recorded by the mailer. A different public response would
      // disclose account existence. The UI explicitly leaves delivery unconfirmed.
      console.error('Account email not confirmed; inspect email_send_records.');
    }
  }
  async function sendAccountMail(mail: Parameters<typeof send>[0], limitKey: string) {
    // Next's after() keeps the Vercel invocation alive for the send, without
    // revealing account existence through provider latency in the HTTP reply.
    if (config.schedule) config.schedule(() => deliverAccountMail(mail, limitKey));
    else await deliverAccountMail(mail, limitKey);
  }
  return betterAuth({
    appName: 'MÅLTID',
    baseURL: config.baseURL,
    secret: config.secret,
    logger: {
      log: (level) => {
        if (level === 'error') console.error('Authentication operation failed.');
      },
    },
    // Use Better Auth's default adapter transaction behavior. Its awaited email
    // callbacks write delivery records through the pool and must run after the
    // user's insert commits (otherwise the mail record FK waits on that insert).
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    trustedOrigins: [config.baseURL],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/verify-email') return;
        const token = typeof ctx.query?.token === 'string' ? ctx.query.token : '';
        // Atomic consumption also prevents parallel replay. Store hashes only.
        const [claimed] = await db
          .delete(schema.verification)
          .where(
            and(
              eq(schema.verification.id, verificationId(token)),
              gt(schema.verification.expiresAt, new Date()),
            ),
          )
          .returning({ id: schema.verification.id });
        if (!claimed) {
          if (ctx.query?.callbackURL)
            throw ctx.redirect(`${config.baseURL}/stadfest-epost?error=INVALID_TOKEN`);
          throw new APIError('BAD_REQUEST', { code: 'INVALID_TOKEN', message: 'Ugyldig lenkje.' });
        }
      }),
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 1800,
      sendResetPassword: async ({ user, url }) => {
        await sendAccountMail(
          linkMail(user.email, user.name, url, 'reset', user.id),
          `auth-email:reset:${user.id}`,
        );
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: false,
      expiresIn: 3600,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url, token }) => {
        const id = verificationId(token);
        await db
          .insert(schema.verification)
          .values({
            id,
            identifier: id,
            value: user.id,
            expiresAt: new Date(Date.now() + 3600_000),
          })
          .onConflictDoNothing();
        await sendAccountMail(
          linkMail(user.email, user.name, url, 'verification', user.id),
          `auth-email:verify:${user.id}`,
        );
      },
      afterEmailVerification: async (user) => {
        // Verification remains valid even if the optional welcome delivery fails; failure is recorded.
        try {
          await send(
            linkMail(user.email, user.name, `${config.baseURL}/oppskrifter`, 'welcome', user.id),
          );
        } catch {
          console.error('Welcome email failed; see email_send_records.');
        }
      },
    },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 60,
      customRules: {
        '/sign-in/email': { window: 60, max: 6 },
        '/sign-up/email': { window: 3600, max: 5 },
        '/request-password-reset': { window: 3600, max: 5 },
        '/send-verification-email': { window: 3600, max: 5 },
      },
    },
    advanced: {
      useSecureCookies: config.baseURL.startsWith('https:'),
      ipAddress: { ipAddressHeaders: ['x-real-ip'] },
    },
  });
}
let auth: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  if (!authConfigured())
    throw new AppError(
      'Kontoar er ikkje tilgjengelege enno. Tenesta manglar database- eller e-postoppsett.',
      503,
    );
  return (auth ??= createAuth(getDb(), {
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    schedule: (task) => after(task),
  }));
}
