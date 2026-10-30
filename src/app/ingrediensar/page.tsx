import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, ArrowUpRight } from 'lucide-react';
import { mealApi } from '@/lib/meal-api';
import { ingredientGroup, ingredientGroups } from '@/lib/ingredient-groups';
import { Photo } from '@/components/photo';
import { SourceFailure, SectionHeading } from '@/components/shared';
import { ProductSearch } from '@/components/product-search';
export const metadata: Metadata = { title: 'Ingrediensar' };
export default async function Ingredients({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; group?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.slice(0, 80) : '';
  const group = typeof params.group === 'string' ? params.group : '';
  const result = await mealApi.ingredients().catch(() => null);
  if (!result)
    return (
      <div className="container page-shell">
        <SourceFailure href="/ingrediensar" />
      </div>
    );
  const filtered = result
    .filter(
      (i) =>
        i.name.toLowerCase().includes(query.toLowerCase()) &&
        (!group || ingredientGroup(i.name) === group),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  const page = Math.max(
    1,
    Math.min(Math.ceil(filtered.length / 24) || 1, parseInt(params.page || '1') || 1),
  );
  const pageUrl = (n: number) =>
    `/ingrediensar?${new URLSearchParams({ q: query, group, page: String(n) })}`;
  return (
    <div className="container page-shell">
      <div className="page-intro">
        <p className="eyebrow">FRÅ JORDA. FRÅ HAVET. TIL BORDET.</p>
        <h1>Bli kjend med råvarene.</h1>
        <p>Finn nye bruksområde, oppdag oppskrifter og utforsk kva som finst i maten din.</p>
      </div>
      <form action="/ingrediensar" className="search-field">
        <Search size={20} />
        <label className="sr-only" htmlFor="ingredient-search">
          Søk etter ingrediens
        </label>
        <input
          id="ingredient-search"
          name="q"
          defaultValue={query}
          placeholder="Søk etter engelsk ingrediensnamn …"
          maxLength={80}
        />
        <input type="hidden" name="group" value={group} />
        <button className="button">Søk</button>
      </form>
      <nav className="tabs" aria-label="Ingredienskategoriar">
        {['', ...ingredientGroups, 'Andre ingrediensar'].map((g) => (
          <Link
            href={`/ingrediensar?${new URLSearchParams({ q: query, group: g })}`}
            key={g}
            aria-current={g === group ? 'page' : undefined}
          >
            {g || 'Alle råvarer'}
          </Link>
        ))}
      </nav>
      <p className="source-note" style={{ marginBottom: 24 }}>
        {filtered.length} ingrediensar · Kategoriar er redaksjonelle, ikkje NOVA-vurderingar. Namn
        og skildringar kjem frå TheMealDB.
      </p>
      {filtered.length ? (
        <>
          <div className="ingredient-catalog">
            {filtered.slice((page - 1) * 24, page * 24).map((i) => (
              <Link className="ingredient-tile" key={i.id} href={`/ingrediensar/${i.slug}`}>
                <div className="ingredient-image">
                  <Photo src={i.image} alt={i.name} contain sizes="(max-width: 600px) 40vw, 20vw" />
                </div>
                <h3>{i.name}</h3>
                <p>{ingredientGroup(i.name)}</p>
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
          <nav className="pagination" aria-label="Ingredienssider">
            {page > 1 && (
              <Link className="button secondary" href={pageUrl(page - 1)}>
                Førre
              </Link>
            )}
            <span>
              Side {page} av {Math.ceil(filtered.length / 24)}
            </span>
            {page * 24 < filtered.length && (
              <Link className="button secondary" href={pageUrl(page + 1)}>
                Neste
              </Link>
            )}
          </nav>
        </>
      ) : (
        <div className="empty-state">
          <h2>Ingen råvarer med dette namnet.</h2>
          <p>Prøv eit engelsk namn, eller vel ein annan kategori.</p>
        </div>
      )}
      <section className="processing-panel" id="produktsok">
        <SectionHeading kicker="KVA ER I PAKNINGA?" title="Sjå nærare på eit produkt." />
        <p>
          Ei råvare er ikkje det same som eit ferdig produkt. Finn den konkrete vara for å sjå
          registrert NOVA-gruppe.
        </p>
        <ProductSearch />
      </section>
    </div>
  );
}
