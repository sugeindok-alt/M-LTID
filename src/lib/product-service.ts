import 'server-only';
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { productCache } from '@/db/schema';
import { createProductAdapter, type Product } from './products';
import { consumeLimit, consumeLocalLimit } from './rate-limit';
import { AppError } from './errors';
const cache = new Map<string, { data: Product[]; until: number }>();
export async function lookupProducts(query: string, barcode: boolean) {
  const key = createHash('sha256')
    .update(`nn-v2:${process.env.OPENFOODFACTS_ENV}:${barcode}:${query.trim().toLowerCase()}`)
    .digest('hex');
  const db = process.env.DATABASE_URL ? getDb() : null;
  if (!db && process.env.NODE_ENV === 'production')
    throw new AppError('Produktsøket ventar på databaseoppsett.', 503);
  if (db) {
    const [record] = await db.select().from(productCache).where(eq(productCache.key, key));
    if (record && record.expiresAt > new Date()) return record.data as Product[];
  } else {
    const entry = cache.get(key);
    if (entry && entry.until > Date.now()) return entry.data;
  }
  // Shared DB limit protects all serverless instances, stricter than upstream quotas.
  if (db)
    await consumeLimit(
      db,
      barcode ? 'off:barcode:global' : 'off:search:global',
      barcode ? 12 : 8,
      60,
    );
  else consumeLocalLimit(barcode ? 'off:barcode' : 'off:search', barcode ? 12 : 8, 60);
  const api = createProductAdapter({
    contact: process.env.OPENFOODFACTS_CONTACT_EMAIL || 'https://github.com/sugeindok-alt/M-LTID',
    staging: process.env.OPENFOODFACTS_ENV === 'staging',
  });
  const one = barcode ? await api.barcode(query) : null;
  const data = barcode ? (one ? [one] : []) : await api.search(query);
  const expiresAt = new Date(Date.now() + 86400000);
  if (db)
    await db
      .insert(productCache)
      .values({ key, data, expiresAt })
      .onConflictDoUpdate({
        target: productCache.key,
        set: { data, expiresAt, fetchedAt: new Date() },
      });
  else {
    if (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(key, { data, until: +expiresAt });
  }
  return data;
}
