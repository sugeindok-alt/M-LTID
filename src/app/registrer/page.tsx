import { AuthPage } from '@/components/auth-page';
export const metadata = { title: 'Opprett konto', robots: { index: false } };
export const dynamic = 'force-dynamic';
export default function Page() {
  return <AuthPage mode="register" />;
}
