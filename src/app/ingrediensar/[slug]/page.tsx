import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { catalog } from '@/lib/catalog';
import { findIngredient } from '@/data/ingredients';
import { IngredientSymbol } from '@/components/ingredient-symbol';
import { RecipeGrid } from '@/components/recipe-card';
import { SourceFailure, SectionHeading } from '@/components/shared';
import { ProductSearch } from '@/components/product-search';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const ingredient = findIngredient((await params).slug);
  return { title: ingredient?.name || 'Ukjend råvare', description: ingredient?.description };
}
export default async function IngredientDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ingredient = findIngredient(slug);
  if (!ingredient) notFound();
  if (decodeURIComponent(slug) !== ingredient.slug)
    permanentRedirect(`/ingrediensar/${ingredient.slug}`);
  const recipes = await catalog.browse({ ingredient: ingredient.name }).catch(() => null);
  return (
    <div className="container page-shell">
      <nav className="breadcrumb" aria-label="Brødsmulesti">
        <Link href="/ingrediensar">Ingrediensar</Link>
        <ChevronRight size={12} />
        <span>{ingredient.name}</span>
      </nav>
      <section className="ingredient-detail">
        <div className="ingredient-detail-image">
          <IngredientSymbol group={ingredient.group} />
        </div>
        <div>
          <p className="eyebrow">{ingredient.group}</p>
          <h1>{ingredient.name}</h1>
          <div className="ingredient-description">
            <p>{ingredient.description}</p>
          </div>
          <p className="source-note">Råvareguiden til MÅLTID.</p>
        </div>
      </section>
      <section>
        <SectionHeading
          kicker="SLIK BLIR RÅVARA BRUKT"
          title="Frå ingrediens til inspirasjon."
          href={`/oppskrifter?ingredient=${encodeURIComponent(ingredient.name)}`}
          link="Alle oppskrifter med råvara"
        />
        <p className="source-note" style={{ marginBottom: 23 }}>
          Middagar i katalogen som inneheld {ingredient.name}.
        </p>
        {recipes === null ? (
          <SourceFailure href={`/ingrediensar/${slug}`} />
        ) : recipes.length ? (
          <RecipeGrid recipes={recipes.slice(0, 6)} />
        ) : (
          <div className="empty-state">
            <p>Vi har ikkje lagt til middagar med denne råvara enno.</p>
          </div>
        )}
      </section>
      <section className="processing-panel">
        <p className="eyebrow">RÅVARE ELLER PRODUKT?</p>
        <h2>Prosessering avheng av kva du vel.</h2>
        <p>
          «{ingredient.name}» er eit generelt ingrediensnamn. Innhald og framstilling varierer
          mellom produkt. Vi set ikkje ein NOVA-klasse på namnet åleine.
        </p>
        <p>
          Søk etter pakninga du faktisk brukar. Treffa er konkrete produkt frå Open Food Facts; dei
          er ikkje automatisk kopla til råvara.
        </p>
        <ProductSearch />
      </section>
    </div>
  );
}
