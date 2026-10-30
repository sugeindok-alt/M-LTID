import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authConfigured, getAuth } from './auth';
import { getFirebaseAuth } from './firebase-auth';
export async function privatePage(path: string) {
  if (!authConfigured()) redirect(`/logg-inn?next=${encodeURIComponent(path)}`);
  const session =
    process.env.AUTH_PROVIDER === 'firebase'
      ? await getFirebaseAuth().getSession(await headers())
      : await getAuth().api.getSession({ headers: await headers() });
  if (!session?.user.emailVerified) redirect(`/logg-inn?next=${encodeURIComponent(path)}`);
  return session.user;
}
