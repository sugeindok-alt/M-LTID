import { AuthPage } from '@/components/auth-page';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Stadfest kontoen',
  robots: { index: false, follow: false },
  referrer: 'no-referrer' as const,
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; oobCode?: string }>;
}) {
  const params = await searchParams;
  // Never trust continueUrl or apiKey from an email link. All API calls stay on our server.
  const supported = params.mode === 'verifyEmail' || params.mode === 'resetPassword';
  return (
    <AuthPage
      mode={params.mode === 'resetPassword' ? 'reset' : 'confirm'}
      token={supported ? params.oobCode : undefined}
      queryError={!supported || !params.oobCode ? 'INVALID_TOKEN' : undefined}
    />
  );
}
