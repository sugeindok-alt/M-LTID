'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { type Recipe } from '@/lib/recipes';
import { RecipeCard } from './recipe-card';
import { api } from '@/lib/client-api';
import { useToast } from './providers';
export function Favorites({ initial }: { initial: Recipe[] }) {
  const [recipes, setRecipes] = useState(initial);
  const [busy, setBusy] = useState('');
  const notify = useToast();
  async function remove(id: string) {
    setBusy(id);
    try {
      await api('favorites', { recipeId: id, saved: false });
      setRecipes((previous) => previous.filter((r) => r.id !== id));
      notify('Oppskrifta er fjerna.');
    } catch (error) {
      notify((error as Error).message, true);
    } finally {
      setBusy('');
    }
  }
  if (!recipes.length)
    return (
      <div className="empty-state">
        <Heart size={30} />
        <h2>Plass til nye favorittar.</h2>
        <p>Lagre oppskriftene du vil lage igjen. Du finn dei her neste gong.</p>
        <Link href="/oppskrifter" className="button">
          Finn noko godt
        </Link>
      </div>
    );
  return (
    <div className="recipe-grid">
      {recipes.map((recipe) => (
        <div key={recipe.id}>
          <RecipeCard recipe={recipe} />
          <button
            className="text-link"
            style={{ marginTop: 14 }}
            disabled={!!busy}
            onClick={() => remove(recipe.id)}
          >
            <Heart size={14} fill="currentColor" />
            {busy === recipe.id ? 'Fjernar …' : 'Fjern frå favorittar'}
          </button>
        </div>
      ))}
    </div>
  );
}
