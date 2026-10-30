import { z } from 'zod';
import { novaGroup, type NovaGroup } from './nova';
import { safeUrl, type Fetcher } from './recipes';
import { AppError, SourceError } from './errors';
export type Product = {
  code: string;
  name: string;
  brands: string;
  image: string | null;
  nova: NovaGroup;
  url: string;
  ingredients: string | null;
  fetchedAt: string;
};
export const barcodeSchema = z.string().regex(/^\d{8,14}$/);
const localizedText = z.union([z.string(), z.record(z.string(), z.string())]).nullish();
const productSchema = z
  .object({
    code: z.string().regex(/^\d+$/),
    product_name: localizedText,
    product_name_en: z.string().nullish(),
    product_name_no: z.string().nullish(),
    product_name_nb: z.string().nullish(),
    product_name_nn: z.string().nullish(),
    lang: z.string().nullish(),
    brands: z.string().nullish(),
    image_front_small_url: z.string().nullish(),
    image_front_url: z.string().nullish(),
    nova_group: z.unknown().optional(),
    ingredients_text: z.string().nullish(),
  })
  .passthrough();
export function normalizeProduct(raw: unknown): Product {
  const p = productSchema.parse(raw);
  const name =
    p.product_name_nn ||
    p.product_name_no ||
    p.product_name_nb ||
    (typeof p.product_name === 'string'
      ? ['no', 'nn', 'nb'].includes(p.lang || '')
        ? p.product_name
        : null
      : p.product_name?.nn || p.product_name?.no || p.product_name?.nb);
  return {
    code: p.code,
    name: name || `Produkt ${p.code} – norsk namn manglar`,
    brands: p.brands || '',
    image: safeUrl(p.image_front_small_url || p.image_front_url, ['images.openfoodfacts.org']),
    nova: novaGroup(p.nova_group),
    url: `https://world.openfoodfacts.org/product/${p.code}`,
    ingredients: ['no', 'nn', 'nb'].includes(p.lang || '') ? p.ingredients_text || null : null,
    fetchedAt: new Date().toISOString(),
  };
}
export function createProductAdapter(config: {
  contact: string;
  staging?: boolean;
  fetcher?: Fetcher;
}) {
  const fetcher = config.fetcher ?? fetch;
  const origin = config.staging
    ? 'https://world.openfoodfacts.net'
    : 'https://world.openfoodfacts.org';
  async function request(url: URL, isSearch = false): Promise<unknown> {
    if (!z.email().safeParse(config.contact).success && !safeUrl(config.contact))
      throw new AppError('Produktsøket manglar kontaktadresse i tenesteoppsettet.', 503);
    try {
      const headers: Record<string, string> = {
        'User-Agent': `MALTID/1.0 (${config.contact})`,
        Accept: 'application/json',
      };
      if (config.staging && !isSearch)
        headers.Authorization = `Basic ${Buffer.from('off:off').toString('base64')}`;
      const response = await fetcher(url, {
        headers,
        signal: AbortSignal.timeout(10000),
        cache: 'no-store',
      });
      if (response.status === 404) return { status: 0 };
      if (!response.ok) throw new Error('Upstream rejected request');
      return await response.json();
    } catch {
      throw new SourceError('Open Food Facts');
    }
  }
  return {
    async barcode(code: string): Promise<Product | null> {
      barcodeSchema.parse(code);
      const url = new URL(`/api/v3.6/product/${code}.json`, origin);
      url.searchParams.set(
        'fields',
        'code,product_name,product_name_no,product_name_nb,product_name_nn,lang,brands,image_front_small_url,nova_group,ingredients_text',
      );
      const result = z
        .object({
          status: z.union([z.number(), z.string()]).optional(),
          product: z.unknown().optional(),
        })
        .parse(await request(url));
      if (!result.product && [0, 'failure'].includes(result.status!)) return null;
      try {
        return normalizeProduct(result.product);
      } catch {
        throw new SourceError('Open Food Facts');
      }
    },
    async search(query: string): Promise<Product[]> {
      z.string().trim().min(2).max(80).parse(query);
      // Search-a-licious is the documented full-text service. No v2 search_terms misuse.
      const url = new URL('https://search.openfoodfacts.org/search');
      const words = query.replace(/[+\-!(){}\[\]^"~*?:\\/|&]/g, ' ').trim();
      if (words.length < 2) throw new AppError('Skriv minst to bokstavar i produktnamnet.');
      url.searchParams.set('q', words);
      url.searchParams.set('page_size', '8');
      url.searchParams.set('langs', 'no,nb,nn');
      url.searchParams.set(
        'fields',
        'code,product_name,product_name_no,product_name_nb,product_name_nn,lang,brands,image_front_small_url,nova_group',
      );
      try {
        const response = z.object({ hits: z.array(z.unknown()) }).parse(await request(url, true));
        return response.hits.map(normalizeProduct);
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw new SourceError('Open Food Facts');
      }
    },
  };
}
