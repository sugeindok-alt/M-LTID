import { privatePage } from '@/lib/private-page';
import { createLibrary } from '@/lib/library';
import { getDb } from '@/db';
import { Favorites } from '@/components/favorites';
import { PrivateNavigation } from '@/components/private-navigation';
export const metadata = { title: 'Mine favorittar', robots: { index: false } };
export const dynamic = 'force-dynamic';
export default async function Page() {
  const user = await privatePage('/favorittar');
  const recipes = await createLibrary(getDb()).favorites(user.id);
  return (
    <div className="container page-shell">
      <div className="page-intro">
        <p className="eyebrow">DI EIGA OPPSKRIFTSBOK</p>
        <h1>Verdt å lage igjen.</h1>
        <p>
          {recipes.length} lagra {recipes.length === 1 ? 'oppskrift' : 'oppskrifter'}, samla på éin
          stad.
        </p>
      </div>
      <PrivateNavigation current="/favorittar" />
      <Favorites initial={recipes} />
    </div>
  );
}
