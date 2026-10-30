import 'server-only';
import { unstable_cache } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { recipeCatalog } from '@/db/schema';
import { catalogSnapshot } from '@/data/catalog';
import { filterRecipes, type RecipeQuery } from './catalog-filter';
import { mealId } from './recipes';
import { SourceError } from './errors';
const all = unstable_cache(
  async () => {
    // A bundled snapshot supports builds and offline development only. Production
    // requires the actual Neon catalogue; database errors never trigger English fallback.
    if (!process.env.DATABASE_URL && process.env.VERCEL_ENV !== 'production')
      return catalogSnapshot;
    try {
      return (await getDb().select({ data: recipeCatalog.data }).from(recipeCatalog)).map(
        (r) => r.data,
      );
    } catch {
      throw new SourceError('MÅLTID-katalogen');
    }
  },
  ['maltid-editorial-catalog-v1'],
  { revalidate: 300 },
);
export const catalog = {
  all,
  async browse(query: RecipeQuery = {}) {
    return filterRecipes(await all(), query);
  },
  async detail(id: string) {
    if (!mealId.safeParse(id).success) return null;
    return (await all()).find((r) => r.id === id && r.language === 'nn') || null;
  },
};
// Database lookup used by mutations: do not serve stale editorial revisions from the page cache.
export async function currentRecipe(id: string) {
  const [row] = await getDb()
    .select()
    .from(recipeCatalog)
    .where(eq(recipeCatalog.id, mealId.parse(id)));
  return row?.data.language === 'nn' ? row.data : null;
}
