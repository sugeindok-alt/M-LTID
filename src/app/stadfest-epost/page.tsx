import { AuthPage } from '@/components/auth-page';
export const metadata = { title: 'Stadfest e-post', robots: { index: false } };
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <AuthPage mode="verify" nextPath={(await searchParams).next} />;
}
