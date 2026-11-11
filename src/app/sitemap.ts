import { catalog } from '@/lib/catalog';
import { publicSitemap } from '@/lib/public-sitemap';

export const revalidate = 300;
export default async function sitemap() {
  return publicSitemap(await catalog.browse());
}
