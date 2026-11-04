'use client';
import { useState } from 'react';
import { Shuffle } from 'lucide-react';
import { RecipeCard } from './recipe-card';
import type { RecipeCardData } from '@/lib/recipes';

export function DinnerChoice({ recipes }: { recipes: RecipeCardData[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const current = recipes.find((recipe) => recipe.id === selected);
  function choose() {
    const others = recipes.filter((recipe) => recipe.id !== selected);
    const choices = others.length ? others : recipes;
    setSelected(choices[Math.floor(Math.random() * choices.length)].id);
  }
  if (!recipes.length) return null;
  return (
    <section className="dinner-choice" aria-label="La MÅLTID velje middag">
      <div className="dinner-choice-intro">
        <div>
          <p className="eyebrow">LITT HJELP TIL Å VELJE</p>
          <h2>Kva med denne?</h2>
          <p>Vi foreslår éin av middagane i utvalet du ser.</p>
        </div>
        <button className="button" onClick={choose} disabled={!!current && recipes.length === 1}>
          <Shuffle size={18} aria-hidden />
          {current ? 'Prøv ein annan' : 'Vel middag for meg'}
        </button>
      </div>
      {current && (
        <div className="dinner-choice-result">
          <p role="status">
            Forslaget ditt er {current.title}. Om lag {current.minutes} minutt.
          </p>
          <RecipeCard key={current.id} recipe={current} />
          {recipes.length === 1 && <p>Dette er den einaste middagen som passar desse vala.</p>}
        </div>
      )}
    </section>
  );
}
