import { privatePage } from '@/lib/private-page';
import { createLibrary } from '@/lib/library';
import { getDb } from '@/db';
import { Profile } from '@/components/profile';
import { PrivateNavigation } from '@/components/private-navigation';
export const metadata = { title: 'Min konto', robots: { index: false } };
export const dynamic = 'force-dynamic';
export default async function Page() {
  const user = await privatePage('/profil');
  const profile = await createLibrary(getDb()).profile(user.id);
  return (
    <div className="container page-shell private-layout">
      <div className="page-intro">
        <p className="eyebrow">VELKOMEN TIL BORDS</p>
        <h1>Hei, {user.name}.</h1>
        <p>Gjer MÅLTID litt meir til ditt.</p>
      </div>
      <PrivateNavigation current="/profil" />
      <Profile
        user={{ name: user.name, email: user.email }}
        preferences={profile.preferences}
        count={profile.favoriteCount}
      />
    </div>
  );
}
