import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ArrowUpRight } from 'lucide-react';
import { catalog } from '@/lib/catalog';
import { mealId, categoryLabels } from '@/lib/recipes';
import { authConfigured } from '@/lib/auth';
import { Photo } from '@/components/photo';
import { RecipeGrid } from '@/components/recipe-card';
import { SectionHeading, SourceFailure } from '@/components/shared';
import { RecipeActions, ProcessingPanel } from '@/components/recipe-interactions';
import { RecipeDirections, RecipePortionLink } from '@/components/recipe-directions';
import { linkedServings } from '@/lib/cooking';
import { recipeMetadata, recipeStructuredData, serializeJsonLd } from '@/lib/recipe-metadata';
import './cooking.css';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!mealId.safeParse(id).success) return { title: 'Ukjend oppskrift' };
  const recipe = await catalog.detail(id).catch(() => null);
  return recipe ? recipeMetadata(recipe) : { title: 'Oppskrift' };
}
export default async function RecipePage({ params, searchParams }: PageProps<'/oppskrifter/[id]'>) {
  const { id } = await params;
  const initialServings = linkedServings((await searchParams).porsjonar);
  if (!mealId.safeParse(id).success) notFound();
  const result = await catalog
    .detail(id)
    .then((recipe) => ({ recipe, error: false }))
    .catch(() => ({ recipe: null, error: true }));
  if (result.error)
    return (
      <div className="container page-shell">
        <SourceFailure href={`/oppskrifter/${id}`} />
      </div>
    );
  const recipe = result.recipe;
  if (!recipe) notFound();
  const related = await catalog.browse({ category: recipe.category }).catch(() => []);
  return (
    <div className="container page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(recipeStructuredData(recipe)) }}
      />
      <nav className="breadcrumb" aria-label="Brødsmulesti">
        <Link href="/">Heim</Link>
        <ChevronRight size={12} />
        <Link href="/oppskrifter">Middagar</Link>
        <ChevronRight size={12} />
        <span>{categoryLabels[recipe.category] || recipe.category}</span>
      </nav>
      <div className="detail-heading">
        <p className="eyebrow">FRÅ OPPSKRIFTSBOKA</p>
        <h1>{recipe.title}</h1>
        {recipe.archived && (
          <p className="source-note">
            Frå arkivet. Du kan framleis bruke denne oppskrifta frå ei lagra lenkje.
          </p>
        )}
        <div className="recipe-meta">
          <span>{categoryLabels[recipe.category] || recipe.category}</span>
          <span className="meta-dot" />
          <span>Om lag {recipe.minutes} min</span>
          <span className="meta-dot" />
          <RecipePortionLink
            id={id}
            steps={recipe.steps.length}
            base={recipe.servings || 4}
            initial={initialServings}
          />
          {recipe.vegetarian && (
            <>
              <span className="meta-dot" />
              <span>Vegetar</span>
            </>
          )}
        </div>
        <p className="recipe-description">{recipe.description}</p>
        <a href="#matlagingsstart" className="recipe-cooking-link">
          Til ingrediensar og matlaging ↓
        </a>
      </div>
      <div className="detail-hero">
        <Photo
          src={recipe.image}
          alt={recipe.imageAlt || recipe.title}
          priority
          natural
          sizes="(max-width: 936px) 100vw, 900px"
        />
      </div>
      {recipe.imageCredit && (
        <p className="source-note image-credit">
          {recipe.imageCredit.note} {recipe.imageCredit.author}.{' '}
          <Link href="/om-innhaldet">Om bileta og oppskriftene</Link>
        </p>
      )}
      <RecipeActions
        key={'actions-' + recipe.id}
        recipe={recipe}
        accountsReady={authConfigured()}
        initialServings={initialServings}
        recipeEmailReady={Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL)}
      />
      <RecipeDirections
        key={'directions-' + recipe.id}
        recipe={recipe}
        initialServings={initialServings}
      >
        <div className="method-links">
          {recipe.source && (
            <a href={recipe.source} target="_blank" rel="noreferrer" className="text-link">
              Originalkjelde <ArrowUpRight size={15} />
            </a>
          )}
          {recipe.youtube && (
            <a href={recipe.youtube} target="_blank" rel="noreferrer" className="text-link">
              Sjå video hos YouTube <ArrowUpRight size={15} />
            </a>
          )}
        </div>
      </RecipeDirections>
      <ProcessingPanel recipe={recipe} accountsReady={authConfigured()} />
      {related.length > 1 && (
        <section className="section">
          <SectionHeading
            kicker="MEIR Å GLE SEG TIL"
            title="Kanskje dette òg smakar?"
            href={`/oppskrifter?category=${encodeURIComponent(recipe.category)}`}
          />
          <RecipeGrid recipes={related.filter((r) => r.id !== id).slice(0, 3)} />
        </section>
      )}
    </div>
  );
}
