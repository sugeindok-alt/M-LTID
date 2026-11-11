import type { MetadataRoute } from 'next';
import { ingredients } from '@/data/ingredients';
import { dinnerWeeks } from '@/data/dinner-weeks';
import { mealId, type Recipe } from './recipes';
import { publicUrl } from './site';

export function publicSitemap(recipes: Recipe[]): MetadataRoute.Sitemap {
  // Allowlist public routes: never enumerate accounts, personal recipes or shared books.
  const paths = [
    '/',
    '/oppskrifter',
    '/ingrediensar',
    '/middagsveker',
    '/om-maten',
    '/om-innhaldet',
    '/personvern',
    ...recipes
      .filter((r) => r.language === 'nn' && !r.archived && mealId.safeParse(r.id).success)
      .map((r) => '/oppskrifter/' + r.id),
    ...ingredients.map((i) => '/ingrediensar/' + encodeURIComponent(i.slug)),
    ...dinnerWeeks.map((week) => '/middagsveker/' + week.slug),
  ];
  // No invented modification dates: the catalogue does not expose revision timestamps.
  return [...new Set(paths)].map((path) => ({ url: publicUrl(path) }));
}
