import { AuthPage } from '@/components/auth-page';
export const metadata = { title: 'Opprett konto', robots: { index: false } };
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <AuthPage mode="register" nextPath={(await searchParams).next} />;
}
