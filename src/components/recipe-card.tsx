import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
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
        <Photo src={recipe.image} alt={recipe.title} />
        <span className="photo-link">
          <ArrowUpRight size={20} />
        </span>
      </Link>
      <div className="recipe-meta">
        <span>
          {recipe.category ? categoryLabels[recipe.category] || recipe.category : 'Oppskrift'}
        </span>
        {recipe.area && (
          <>
            <span className="meta-dot" />
            <span>{recipe.area}</span>
          </>
        )}
      </div>
      <h3>
        <Link href={`/oppskrifter/${recipe.id}`}>{recipe.title}</Link>
      </h3>
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
