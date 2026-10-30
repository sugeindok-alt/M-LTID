import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { mealApi } from '@/lib/meal-api';
import { ingredientGroup } from '@/lib/ingredient-groups';
import { Photo } from '@/components/photo';
import { RecipeGrid } from '@/components/recipe-card';
import { SourceFailure, SectionHeading } from '@/components/shared';
import { ProductSearch } from '@/components/product-search';
export default async function IngredientDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ingredients = await mealApi.ingredients().catch(() => null);
  if (!ingredients)
    return (
      <div className="container page-shell">
        <SourceFailure href={`/ingrediensar/${encodeURIComponent(slug)}`} />
      </div>
    );
  const ingredient = ingredients.find((i) => i.slug === slug);
  if (!ingredient) notFound();
  const recipes = await mealApi.browse({ ingredient: ingredient.name }).catch(() => null);
  return (
    <div className="container page-shell">
      <nav className="breadcrumb" aria-label="Brødsmulesti">
        <Link href="/ingrediensar">Ingrediensar</Link>
        <ChevronRight size={12} />
        <span>{ingredient.name}</span>
      </nav>
      <section className="ingredient-detail">
        <div className="ingredient-detail-image">
          <Photo
            src={ingredient.image}
            alt={ingredient.name}
            contain
            priority
            sizes="(max-width:800px) 300px, 40vw"
          />
        </div>
        <div>
          <p className="eyebrow">{ingredientGroup(ingredient.name)}</p>
          <h1>{ingredient.name}</h1>
          <div className="ingredient-description">
            <p>
              {ingredient.description ||
                'TheMealDB har ikkje ei skildring av denne ingrediensen enno. Utforsk oppskriftene nedanfor for konkrete bruksområde.'}
            </p>
          </div>
          <p className="source-note">Skildring og foto: TheMealDB. Originalspråket er bevart.</p>
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
          Bruksområda nedanfor kjem frå oppskrifter som inneheld {ingredient.name}. Ingen
          bruksområde er gjetta.
        </p>
        {recipes === null ? (
          <SourceFailure href={`/ingrediensar/${slug}`} />
        ) : recipes.length ? (
          <RecipeGrid recipes={recipes.slice(0, 6)} />
        ) : (
          <div className="empty-state">
            <p>Kjelda har ikkje oppskrifter med denne ingrediensen akkurat no.</p>
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
