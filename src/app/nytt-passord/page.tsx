import { AuthPage } from '@/components/auth-page';
export const metadata = { title: 'Nytt passord', robots: { index: false } };
export const dynamic = 'force-dynamic';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  return <AuthPage mode="reset" token={params.token} queryError={params.error} />;
}
