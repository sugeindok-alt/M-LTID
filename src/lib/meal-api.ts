import 'server-only';
import { z } from 'zod';
import { SourceError } from './errors';
import {
  normalizeCard,
  normalizeRecipe,
  ingredientSlug,
  mealId,
  type Recipe,
  type RecipeCardData,
  type Fetcher,
} from './recipes';
const text = z.string().nullish();
export function createMealAdapter(
  fetcher: Fetcher = fetch,
  key = process.env.THEMEALDB_API_KEY || '1',
) {
  async function request(endpoint: string, query: Record<string, string>) {
    const url = new URL(
      `https://www.themealdb.com/api/json/v1/${encodeURIComponent(key)}/${endpoint}.php`,
    );
    url.search = new URLSearchParams(query).toString();
    try {
      const response = await fetcher(url, {
        signal: AbortSignal.timeout(12000),
        next: { revalidate: 3600 },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as unknown;
    } catch {
      throw new SourceError('TheMealDB');
    }
  }
  async function meals(endpoint: string, query: Record<string, string>, full = false) {
    try {
      const body = z
        .object({ meals: z.array(z.unknown()).nullable() })
        .parse(await request(endpoint, query));
      return (body.meals ?? []).map(full ? normalizeRecipe : normalizeCard);
    } catch {
      throw new SourceError('TheMealDB');
    }
  }
  return {
    async detail(id: string): Promise<Recipe | null> {
      mealId.parse(id);
      return ((await meals('lookup', { i: id }, true))[0] as Recipe) ?? null;
    },
    async browse(
      input: {
        q?: string;
        category?: string;
        area?: string;
        ingredient?: string;
        sort?: string;
      } = {},
    ) {
      // Intersect supported single-filter V1 endpoints; never call premium multi-ingredient endpoints.
      const requests: Promise<RecipeCardData[]>[] = [];
      if (input.q) requests.push(meals('search', { s: input.q }));
      if (input.category) requests.push(meals('filter', { c: input.category }));
      if (input.area) requests.push(meals('filter', { a: input.area }));
      if (input.ingredient) requests.push(meals('filter', { i: input.ingredient }));
      if (!requests.length) requests.push(meals('search', { s: '' }));
      const [first, ...rest] = await Promise.all(requests);
      const matches = first.filter((r) =>
        rest.every((list) => list.some((item) => item.id === r.id)),
      );
      return matches.sort((a, b) =>
        input.sort === 'za' ? b.title.localeCompare(a.title) : a.title.localeCompare(b.title),
      );
    },
    async categories() {
      try {
        return z
          .object({
            categories: z.array(
              z.object({
                strCategory: z.string(),
                strCategoryThumb: z.string(),
                strCategoryDescription: z.string(),
              }),
            ),
          })
          .parse(await request('categories', {})).categories;
      } catch {
        throw new SourceError('TheMealDB');
      }
    },
    async areas() {
      try {
        return [
          ...new Set(
            z
              .object({ meals: z.array(z.object({ strArea: z.string() })) })
              .parse(await request('list', { a: 'list' }))
              .meals.map((m) => m.strArea),
          ),
        ];
      } catch {
        throw new SourceError('TheMealDB');
      }
    },
    async ingredients() {
      try {
        return z
          .object({
            meals: z.array(
              z.object({
                idIngredient: z.string(),
                strIngredient: z.string().min(1),
                strDescription: text,
                strType: text,
              }),
            ),
          })
          .parse(await request('list', { i: 'list' }))
          .meals.map((i) => ({
            id: i.idIngredient,
            name: i.strIngredient,
            slug: ingredientSlug(i.strIngredient),
            description: i.strDescription || null,
            type: i.strType || null,
            image: `https://www.themealdb.com/images/ingredients/${encodeURIComponent(i.strIngredient.replaceAll(' ', '_'))}.png`,
          }));
      } catch {
        throw new SourceError('TheMealDB');
      }
    },
  };
}

export const mealApi = createMealAdapter();
