import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { catalog } from '@/lib/catalog';
import { dinnerCategories, mainIngredients } from '@/lib/catalog-filter';
import { RecipeGrid } from '@/components/recipe-card';
import { SourceFailure } from '@/components/shared';
export const metadata: Metadata = {
  title: 'Middagar',
  description:
    'Finn norske kvardagsmiddagar. Søk etter råvarer og kombiner filter for tid, hovudingrediens og vegetar.',
};
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
    ingredient: val('ingredient'),
    maxTime: val('maxTime'),
    vegetarian: val('vegetarian'),
    sort: val('sort'),
  };
  const recipes = await catalog.browse(query).catch(() => null);
  return (
    <div className="container page-shell">
      <div className="page-intro">
        <p className="eyebrow">GOD MAT TIL VANLEGE DAGAR</p>
        <h1>Kva blir det til middag?</h1>
        <p>
          Norske klassikarar og nye kvardagsfavorittar. Finn ein middag som passar tida og råvarene
          du har.
        </p>
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
            placeholder="Søk etter middag eller råvare …"
            maxLength={80}
          />
          <button className="button">
            Søk <ArrowRight size={17} />
          </button>
        </div>
        <div className="filter-row dinner-filters">
          <label>
            Tidsbruk
            <select name="maxTime" defaultValue={query.maxTime}>
              <option value="">Alle tider</option>
              <option value="30">Inntil 30 min</option>
              <option value="45">Inntil 45 min</option>
              <option value="60">Inntil 60 min</option>
            </select>
          </label>
          <label>
            Hovudingrediens
            <select name="ingredient" defaultValue={query.ingredient}>
              <option value="">Alle råvarer</option>
              {query.ingredient && !mainIngredients.includes(query.ingredient) && (
                <option>{query.ingredient}</option>
              )}
              {mainIngredients.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Kategori
            <select name="category" defaultValue={query.category}>
              <option value="">Alle middagar</option>
              {dinnerCategories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Sorter
            <select name="sort" defaultValue={query.sort}>
              <option value="">Vårt utval</option>
              <option value="time">Raskast først</option>
              <option value="az">Namn A–Å</option>
              <option value="za">Namn Å–A</option>
            </select>
          </label>
          <label className="vegetarian-check">
            <input
              type="checkbox"
              name="vegetarian"
              value="1"
              defaultChecked={query.vegetarian === '1'}
            />{' '}
            Berre vegetar
          </label>
          <button className="button secondary">Bruk filter</button>
        </div>
      </form>
      <div className="results-heading">
        <p role="status">
          {recipes
            ? `${recipes.length} ${recipes.length === 1 ? 'middag' : 'middagar'}`
            : 'Middagar'}
        </p>
        <Link className="text-link" href="/oppskrifter">
          Nullstill filter
        </Link>
      </div>
      {recipes === null ? (
        <SourceFailure />
      ) : recipes.length ? (
        <RecipeGrid recipes={recipes} />
      ) : (
        <div className="empty-state">
          <Search size={32} />
          <h2>Ingen middagar passar søket.</h2>
          <p>Prøv ei anna råvare eller færre filter.</p>
          <Link className="button secondary" href="/oppskrifter">
            Sjå alle middagar
          </Link>
        </div>
      )}
    </div>
  );
}
