import type { Recipe } from './recipes';
export type RecipeQuery = {
  q?: string;
  category?: string;
  ingredient?: string;
  maxTime?: string;
  vegetarian?: string;
  sort?: string;
};
export const dinnerCategories = [
  'Tradisjonsmat',
  'Fisk',
  'Kylling',
  'Pasta',
  'Supper og gryter',
  'Helgemat',
  'Vegetar',
];
export const mainIngredients = [
  'Storfe',
  'Lam',
  'Fisk',
  'Kylling',
  'Grønsaker',
  'Belgfrukter',
  'Egg',
  'Pasta',
];
export const fold = (text: string) =>
  text
    .toLocaleLowerCase('nn-NO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('ø', 'o')
    .replaceAll('æ', 'ae')
    .replaceAll('kjott', 'kjot')
    .trim();
export function filterRecipes(recipes: Recipe[], query: RecipeQuery = {}) {
  const words = fold(query.q || '')
    .split(/\s+/)
    .filter(Boolean);
  const minutes = Number(query.maxTime);
  return recipes
    .filter((r) => !r.archived && r.language === 'nn')
    .filter((r) =>
      words.every((word) =>
        fold(
          [r.title, r.description, ...r.tags, ...r.ingredients.map((i) => i.name)].join(' '),
        ).includes(word),
      ),
    )
    .filter((r) => !query.category || r.category === query.category)
    .filter(
      (r) =>
        !query.ingredient ||
        fold(r.mainIngredient || '') === fold(query.ingredient) ||
        r.ingredients.some((i) => fold(i.name).includes(fold(query.ingredient!))),
    )
    .filter((r) => !minutes || Boolean(r.minutes && r.minutes <= minutes))
    .filter((r) => query.vegetarian !== '1' || r.vegetarian)
    .sort((a, b) =>
      query.sort === 'time'
        ? (a.minutes || 999) - (b.minutes || 999)
        : query.sort === 'za'
          ? b.title.localeCompare(a.title, 'nn')
          : query.sort === 'az'
            ? a.title.localeCompare(b.title, 'nn')
            : (a.featured || 99) - (b.featured || 99),
    );
}
