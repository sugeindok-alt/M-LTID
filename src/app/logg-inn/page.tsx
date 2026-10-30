import { AuthPage } from '@/components/auth-page';
export const metadata = { title: 'Logg inn', robots: { index: false } };
export const dynamic = 'force-dynamic';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return <AuthPage mode="login" nextPath={params.next} queryError={params.error} />;
}
