import Link from 'next/link';
import { ArrowUpRight, Clock3, Leaf } from 'lucide-react';
import { Photo } from './photo';
import { categoryLabels, type RecipeCardData } from '@/lib/recipes';
export function RecipeCard({ recipe }: { recipe: RecipeCardData }) {
  return (
    <article className="recipe-card">
      <Link
        href={`/oppskrifter/${recipe.id}`}
        className="recipe-photo"
        aria-label={`Sjå ${recipe.title}`}
      >
        <Photo src={recipe.image} alt={recipe.imageAlt || recipe.title} />
        {recipe.imageCredit && <span className="image-label">Illustrasjon</span>}
        <span className="photo-link">
          <ArrowUpRight size={20} />
        </span>
      </Link>
      <div className="recipe-card-body">
        <p className="meta-category">
          {recipe.category ? categoryLabels[recipe.category] || recipe.category : 'Oppskrift'}
        </p>
        <h3>
          <Link href={`/oppskrifter/${recipe.id}`}>{recipe.title}</Link>
        </h3>
        <div className="recipe-meta">
          {recipe.minutes && (
            <span className="meta-chip">
              <Clock3 size={14} aria-hidden /> Om lag {recipe.minutes} min
            </span>
          )}
          {recipe.vegetarian && (
            <span className="meta-chip meta-green">
              <Leaf size={14} aria-hidden /> Vegetar
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
export function RecipeGrid({ recipes }: { recipes: RecipeCardData[] }) {
  return (
    <div className="recipe-grid">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}
