import Link from 'next/link';
import Image from 'next/image';
import { Pencil } from 'lucide-react';
import { RecipeDirections } from '@/components/recipe-directions';
import { asRecipe } from '@/lib/cookbook';
import { privateLabel } from '@/lib/cookbook-types';
import { loadEntry } from './load';
import '../../oppskrifter/[id]/cooking.css';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await loadEntry(id),
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
          {entry.servings} {entry.servings === 1 ? 'porsjon' : 'porsjonar'}
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
          <Image
            unoptimized
            fill
            sizes="100vw"
            src={recipe.image}
            alt={entry.title}
            className="photo-cover"
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
      <RecipeDirections key={recipe.id} recipe={recipe} privateRecipe />
    </div>
  );
}
