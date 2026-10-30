import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { mealApi } from '@/lib/meal-api';
import { categoryLabels } from '@/lib/recipes';
import { RecipeGrid } from '@/components/recipe-card';
import { SourceFailure } from '@/components/shared';
export const metadata: Metadata = { title: 'Oppskrifter' };
export default async function Recipes({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const val = (key: string) => (typeof params[key] === 'string' ? params[key].slice(0, 80) : '');
  const query = {
    q: val('q'),
    category: val('category'),
    area: val('area'),
    ingredient: val('ingredient'),
    sort: val('sort'),
  };
  const [results, categories, areas] = await Promise.allSettled([
    mealApi.browse(query),
    mealApi.categories(),
    mealApi.areas(),
  ]);
  const recipes = results.status === 'fulfilled' ? results.value : [];
  const page = Math.max(
    1,
    Math.min(Math.ceil(recipes.length / 12) || 1, parseInt(val('page')) || 1),
  );
  const pageUrl = (n: number) => {
    const p = new URLSearchParams(Object.entries(query).filter(([, v]) => v));
    p.set('page', String(n));
    return `/oppskrifter?${p}`;
  };
  return (
    <div className="container page-shell">
      <div className="page-intro">
        <p className="eyebrow">INSPIRASJON TIL NESTE MÅLTID</p>
        <h1>Kva har du lyst på?</h1>
        <p>Ein gammal favoritt eller ein heilt ny smak. Finn noko du gler deg til å lage.</p>
      </div>
      <form action="/oppskrifter" className="discovery-form">
        <div className="search-field">
          <Search size={20} />
          <label htmlFor="recipe-search" className="sr-only">
            Søk etter oppskrift
          </label>
          <input
            id="recipe-search"
            name="q"
            defaultValue={query.q}
            placeholder="Søk etter ei oppskrift …"
            maxLength={80}
          />
          <button className="button" type="submit">
            Søk <ArrowRight size={17} />
          </button>
        </div>
        <div className="filter-row">
          <label>
            Kategori
            <select name="category" defaultValue={query.category}>
              <option value="">Alle kategoriar</option>
              {categories.status === 'fulfilled' &&
                categories.value.map((c) => (
                  <option key={c.strCategory} value={c.strCategory}>
                    {categoryLabels[c.strCategory] || c.strCategory}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Matkultur
            <select name="area" defaultValue={query.area}>
              <option value="">Heile verda</option>
              {areas.status === 'fulfilled' && areas.value.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
          <label>
            Ingrediens
            <input
              name="ingredient"
              defaultValue={query.ingredient}
              placeholder="Til dømes chicken"
              maxLength={80}
            />
          </label>
          <label>
            Sorter
            <select name="sort" defaultValue={query.sort || 'az'}>
              <option value="az">Namn A–Å</option>
              <option value="za">Namn Å–A</option>
            </select>
          </label>
          <button className="button secondary" type="submit">
            Bruk filter
          </button>
        </div>
      </form>
      <div className="results-heading">
        <p>
          {results.status === 'fulfilled'
            ? `${recipes.length} oppskrifter i dette API-utvalet`
            : 'Oppskrifter'}
        </p>
        <Link href="/oppskrifter" className="text-link">
          Nullstill filter
        </Link>
      </div>
      <p className="source-note search-note">
        Søk med engelske namn frå kjelda. Utvalet er avgrensa av gratis-API-et; det er ikkje heile
        databasen.
      </p>
      {results.status === 'rejected' ? (
        <SourceFailure />
      ) : recipes.length ? (
        <>
          <RecipeGrid recipes={recipes.slice((page - 1) * 12, page * 12)} />
          <nav className="pagination" aria-label="Resultatsider">
            {page > 1 && (
              <Link className="button secondary" href={pageUrl(page - 1)}>
                Førre
              </Link>
            )}
            <span>
              Side {page} av {Math.ceil(recipes.length / 12)}
            </span>
            {page * 12 < recipes.length && (
              <Link className="button secondary" href={pageUrl(page + 1)}>
                Neste <ArrowRight size={16} />
              </Link>
            )}
          </nav>
        </>
      ) : (
        <div className="empty-state">
          <Search size={32} />
          <h2>Ingen oppskrifter enno.</h2>
          <p>Prøv eit anna engelsk søkjeord eller færre filter.</p>
          <Link className="button secondary" href="/oppskrifter">
            Sjå oppskrifter
          </Link>
        </div>
      )}
    </div>
  );
}
