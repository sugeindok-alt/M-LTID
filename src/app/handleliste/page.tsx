import { privatePage } from '@/lib/private-page';
import { createLibrary } from '@/lib/library';
import { getDb } from '@/db';
import { ShoppingList } from '@/components/shopping-list';
import { PrivateNavigation } from '@/components/private-navigation';
export const metadata = { title: 'Handleliste', robots: { index: false } };
export const dynamic = 'force-dynamic';
export default async function Page() {
  const user = await privatePage('/handleliste');
  const items = await createLibrary(getDb()).shopping(user.id);
  return (
    <div className="container page-shell private-layout">
      <div className="page-intro">
        <p className="eyebrow">FRÅ PLAN TIL HANDLEPOSE</p>
        <h1>Hugs alt det gode.</h1>
        <p>Handlelista di følgjer kontoen, også på neste eining.</p>
      </div>
      <PrivateNavigation current="/handleliste" />
      <ShoppingList
        initial={items.map((i) => ({
          id: i.id,
          name: i.name,
          measure: i.measure,
          amount: i.amount,
          unit: i.unit,
          purchased: i.purchased,
        }))}
      />
    </div>
  );
}
