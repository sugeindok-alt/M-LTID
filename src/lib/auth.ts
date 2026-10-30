import 'server-only';
import { betterAuth } from 'better-auth';
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
    if (production && url.protocol !== 'https:') return false;
  } catch {
    return false;
  }
  return Boolean(
    (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) ||
    (process.env.EMAIL_TRANSPORT === 'file' && !production),
  );
};
export function createAuth(
  db: Database,
  config: { secret: string; baseURL: string; transport?: MailTransport },
) {
  const send = createMailer(db, config.transport);
  return betterAuth({
    appName: 'MÅLTID',
    baseURL: config.baseURL,
    secret: config.secret,
    // Use Better Auth's default adapter transaction behavior. Its awaited email
    // callbacks write delivery records through the pool and must run after the
    // user's insert commits (otherwise the mail record FK waits on that insert).
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    trustedOrigins: [config.baseURL],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 1800,
      sendResetPassword: async ({ user, url }) => {
        await consumeLimit(db, `auth-email:reset:${user.id}`, 3, 3600);
        await send(linkMail(user.email, user.name, url, 'reset', user.id));
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: false,
      expiresIn: 3600,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await consumeLimit(db, `auth-email:verify:${user.id}`, 3, 3600);
        await send(linkMail(user.email, user.name, url, 'verification', user.id));
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
  }));
}
