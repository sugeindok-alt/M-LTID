import { z } from 'zod';
export type Ingredient = { name: string; measure: string; slug?: string };
export type RecipeCardData = {
  id: string;
  title: string;
  image: string;
  category?: string;
  area?: string;
  minutes?: number;
  vegetarian?: boolean;
  mainIngredient?: string;
  imageAlt?: string;
  imageCredit?: { author: string; license: string; url: string; licenseUrl: string; note?: string };
};
export type Recipe = RecipeCardData & {
  category: string;
  area: string;
  ingredients: Ingredient[];
  steps: string[];
  source: string | null;
  youtube: string | null;
  tags: string[];
  description?: string;
  servings?: number;
  language?: 'nn';
  featured?: number;
  archived?: boolean;
};
export const mealId = z.string().regex(/^(?:\d{1,10}|nn-[a-z0-9-]{2,70})$/);
const text = z.string().nullish();
const baseMeal = z
  .object({
    idMeal: mealId,
    strMeal: z.string().trim().min(1),
    strMealThumb: z.string().url(),
    strCategory: text,
    strArea: text,
  })
  .passthrough();
const fullMeal = baseMeal.extend({
  strInstructions: z.string().trim().min(1),
  strSource: text,
  strYoutube: text,
  strTags: text,
});
export function safeUrl(value: string | null | undefined, hosts?: string[]) {
  try {
    const u = new URL(value ?? '');
    return u.protocol === 'https:' && (!hosts || hosts.includes(u.hostname)) ? u.href : null;
  } catch {
    return null;
  }
}
export function normalizeCard(value: unknown): RecipeCardData {
  const raw = baseMeal.parse(value);
  const image = safeUrl(raw.strMealThumb, ['www.themealdb.com']);
  if (!image) throw new Error('Invalid recipe image host');
  return {
    id: raw.idMeal,
    title: raw.strMeal,
    image,
    category: raw.strCategory || undefined,
    area: raw.strArea || undefined,
  };
}
export function normalizeRecipe(value: unknown): Recipe {
  const raw = fullMeal.parse(value);
  const ingredients: Ingredient[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = raw[`strIngredient${i}`];
    const measure = raw[`strMeasure${i}`];
    if (typeof name === 'string' && name.trim())
      ingredients.push({
        name: name.trim(),
        measure: typeof measure === 'string' ? measure.trim() : '',
      });
  }
  return {
    ...normalizeCard(raw),
    category: raw.strCategory || 'Ikkje oppgitt',
    area: raw.strArea || 'Ikkje oppgitt',
    ingredients,
    steps: raw.strInstructions
      .split(/\r?\n+/)
      .map((s) => s.trim())
      .filter(Boolean),
    source: safeUrl(raw.strSource),
    youtube: safeUrl(raw.strYoutube, ['www.youtube.com', 'youtube.com', 'youtu.be']),
    tags: (raw.strTags ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  };
}
export type Fetcher = typeof fetch;
export function ingredientSlug(name: string) {
  return name.toLowerCase().replaceAll(' ', '-');
}
export const categoryLabels: Record<string, string> = {
  Beef: 'Storfe',
  Chicken: 'Kylling',
  Dessert: 'Dessert',
  Lamb: 'Lam',
  Miscellaneous: 'Anna',
  Pasta: 'Pasta',
  Pork: 'Svin',
  Seafood: 'Sjømat',
  Side: 'Tilbehøyr',
  Starter: 'Forrett',
  Vegan: 'Vegansk',
  Vegetarian: 'Vegetar',
  Breakfast: 'Frukost',
  Goat: 'Geit',
};
