import Link from 'next/link';
import { Plus, BookOpen } from 'lucide-react';
import { PrivateNavigation } from '@/components/private-navigation';
import { privatePage } from '@/lib/private-page';
import { getDb } from '@/db';
import { listCookbook } from '@/lib/cookbook';
import { privateLabel } from '@/lib/cookbook-types';
export default async function Page() {
  const user = await privatePage('/kokebok');
  const rows = await listCookbook(getDb(), user.id);
  return (
    <div className="container page-shell private-layout book-page">
      <div className="page-intro">
        <p className="eyebrow">DINE OPPSKRIFTER</p>
        <h1>Mi kokebok.</h1>
        <p>Samle eigne middagar og variantar her. Berre du kan sjå dei.</p>
      </div>
      <PrivateNavigation current="/kokebok" />
      <Link href="/kokebok/ny" className="button">
        <Plus size={18} />
        Ny oppskrift
      </Link>
      {rows.length ? (
        <ul className="book-list">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={'/kokebok/' + r.id}>
                <span className="eyebrow">{privateLabel(r.originalId)}</span>
                <h2>{r.title}</h2>
                <p>
                  {r.servings} {r.servings === 1 ? 'porsjon' : 'porsjonar'}
                  {r.originalTitle && ' · Original: ' + r.originalTitle}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="book-empty">
          <BookOpen size={24} />
          <h2>Plass til den første oppskrifta di.</h2>
          <p>
            Skriv inn ein middag du likar, eller vel «Lag min variant» på ei{' '}
            <Link href="/oppskrifter" className="text-link">
              oppskrift frå MÅLTID
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
