import Link from 'next/link';
import { Photo } from '@/components/photo';
import { Pencil } from 'lucide-react';
import { RecipeDirections, RecipePortionLink } from '@/components/recipe-directions';
import { linkedServings } from '@/lib/cooking';
import { asRecipe } from '@/lib/cookbook';
import { privateLabel } from '@/lib/cookbook-types';
import { loadEntry } from './load';
import '../../oppskrifter/[id]/cooking.css';
export default async function Page({ params, searchParams }: PageProps<'/kokebok/[id]'>) {
  const { id } = await params;
  const initialServings = linkedServings((await searchParams).porsjonar);
  const entry = await loadEntry(id, false, initialServings),
    recipe = asRecipe(entry);
  return (
    <div className="container page-shell book-page">
      <Link className="text-link" href="/kokebok">
        ← Mi kokebok
      </Link>
      <div className="detail-heading">
        <p className="eyebrow">{privateLabel(entry.originalId)} · Privat</p>
        <h1>{entry.title}</h1>
        <div className="recipe-meta">
          <RecipePortionLink
            id={id}
            steps={recipe.steps.length}
            base={entry.servings}
            initial={initialServings}
          />
        </div>
        {entry.originalId && (
          <p>
            Original frå MÅLTID:{' '}
            <Link className="text-link" href={'/oppskrifter/' + entry.originalId}>
              {entry.originalTitle}
            </Link>
          </p>
        )}
      </div>
      {recipe.image && (
        <div className="detail-hero">
          <Photo
            unoptimized
            natural
            sizes="(max-width: 936px) 100vw, 900px"
            src={recipe.image}
            alt={entry.title}
          />
        </div>
      )}
      <div className="book-tools">
        <Link className="button secondary" href={'/kokebok/' + id + '/rediger'}>
          <Pencil size={16} />
          Rediger oppskrifta
        </Link>
        <Link className="text-link" href="/mi-veke">
          Planlegg i Mi veke →
        </Link>
      </div>
      <RecipeDirections
        key={recipe.id}
        recipe={recipe}
        privateRecipe
        initialServings={initialServings}
      />
    </div>
  );
}
