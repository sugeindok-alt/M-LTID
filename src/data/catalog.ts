import { editorialRecipes } from './recipes';
import credits from './image-credits.json';
import type { Recipe } from '@/lib/recipes';
const images = credits as Record<
  string,
  { image: string; imageCredit: NonNullable<Recipe['imageCredit']> }
>;
export const catalogSnapshot: Recipe[] = editorialRecipes.map((r) => ({ ...r, ...images[r.id] }));
// Preserve the only saved legacy recipe under its original ID. Its original cache
// and favourite association remain untouched; the presentation is now Nynorsk.
const pasta = catalogSnapshot.find((r) => r.id === 'nn-pasta-tomat')!;
catalogSnapshot.push({
  ...pasta,
  id: '52771',
  archived: true,
  title: 'Penne med kvitlauk og chili',
  description:
    'Den lagra pastaoppskrifta di har fått norsk tekst og norske mål. Favoritten er bevart.',
  ingredients: pasta.ingredients.map((i) => (i.name === 'penne' ? { ...i, measure: '450 g' } : i)),
});
export function presentSavedRecipe(recipe: Recipe): Recipe {
  if (recipe.language === 'nn') return recipe;
  return (
    catalogSnapshot.find((r) => r.id === recipe.id) || {
      ...recipe,
      title: 'Tidlegare lagra oppskrift',
      image: '',
      area: '',
      category: 'Arkiv',
      ingredients: [],
      steps: [],
      tags: [],
      source: null,
      youtube: null,
      description: 'Oppskrifta er bevart i kontoen, men har ikkje norsk tekst enno.',
      archived: true,
    }
  );
}
