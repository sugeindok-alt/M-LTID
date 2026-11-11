import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, ArrowUpRight } from 'lucide-react';
import { ingredients, ingredientGroups } from '@/data/ingredients';
import { RawIngredientPhoto } from '@/components/raw-ingredient-photo';
import { SectionHeading } from '@/components/shared';
import { fold, filterRecipes } from '@/lib/catalog-filter';
import { catalog } from '@/lib/catalog';
import { PageHero } from '@/components/page-hero';
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
  const result = ingredients;
  const filtered = result
    .filter((i) => fold(i.name).includes(fold(query)) && (!group || i.group === group))
    .sort((a, b) => a.name.localeCompare(b.name, 'nn'));
  const page = Math.max(
    1,
    Math.min(Math.ceil(filtered.length / 24) || 1, parseInt(params.page || '1') || 1),
  );
  const pageUrl = (n: number) =>
    `/ingrediensar?${new URLSearchParams({ q: query, group, page: String(n) })}`;
  // Toppbiletet er ein grønsaksrett frå katalogen. Utan katalog blir toppen eit mørkt band.
  const lead = await catalog
    .browse()
    .then((recipes) => filterRecipes(recipes, { vegetarian: '1' })[0])
    .catch(() => null);
  return (
    <div className="cine-shell">
      <PageHero
        kicker="FRÅ JORDA. FRÅ HAVET. TIL BORDET."
        title="Bli kjend med råvarene."
        text="Finn nye bruksområde, oppdag oppskrifter og utforsk kva som finst i maten din."
        image={
          lead && {
            src: lead.image,
            alt: lead.imageAlt || lead.title,
            illustration: !!lead.imageCredit,
          }
        }
      />
      <form action="/ingrediensar" className="search-field ingredient-search">
        <Search size={20} />
        <label className="sr-only" htmlFor="ingredient-search">
          Søk etter ingrediens
        </label>
        <input
          id="ingredient-search"
          name="q"
          defaultValue={query}
          placeholder="Søk etter poteter, gulrøter, laks …"
          maxLength={80}
        />
        <input type="hidden" name="group" value={group} />
        <button className="button">Søk</button>
      </form>
      <nav className="tabs" aria-label="Ingredienskategoriar">
        {['', ...ingredientGroups].map((g) => (
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
        {filtered.length} ingrediensar · Kategoriar er redaksjonelle, ikkje NOVA-vurderingar. Bileta
        er KI-genererte illustrasjonar av kvar råvare, laga for MÅLTID.
      </p>
      {filtered.length ? (
        <>
          <div className="ingredient-catalog">
            {filtered.slice((page - 1) * 24, page * 24).map((i) => (
              <Link className="ingredient-tile" key={i.id} href={`/ingrediensar/${i.slug}`}>
                <div className="ingredient-image">
                  <RawIngredientPhoto ingredient={i} />
                </div>
                <h3>{i.name}</h3>
                <p>{i.group}</p>
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
          <p>Prøv eit anna norsk namn, eller vel ein annan kategori.</p>
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
