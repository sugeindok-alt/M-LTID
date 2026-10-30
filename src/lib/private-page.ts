import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authConfigured, getAuth } from './auth';
export async function privatePage(path: string) {
  if (!authConfigured()) redirect(`/logg-inn?next=${encodeURIComponent(path)}`);
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session?.user.emailVerified) redirect(`/logg-inn?next=${encodeURIComponent(path)}`);
  return session.user;
}
