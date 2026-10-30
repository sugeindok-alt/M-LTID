import { sql } from 'drizzle-orm';
import type { Database } from '@/db';
import { requestLimits } from '@/db/schema';
import { AppError } from './errors';
export async function consumeLimit(db: Database, key: string, max: number, seconds: number) {
  const expiry = new Date(Date.now() + seconds * 1000);
  const [row] = await db
    .insert(requestLimits)
    .values({ key, count: 1, expiresAt: expiry })
    .onConflictDoUpdate({
      target: requestLimits.key,
      set: {
        count: sql`case when ${requestLimits.expiresAt} <= now() then 1 else ${requestLimits.count} + 1 end`,
        expiresAt: sql`case when ${requestLimits.expiresAt} <= now() then ${expiry}::timestamptz else ${requestLimits.expiresAt} end`,
      },
    })
    .returning();
  if (row.count > max) throw new AppError('For mange førespurnader. Vent litt og prøv igjen.', 429);
}
const local = new Map<string, { count: number; until: number }>();
export function consumeLocalLimit(key: string, max: number, seconds: number) {
  const now = Date.now();
  for (const [k, v] of local) if (v.until < now) local.delete(k);
  const entry = local.get(key) ?? { count: 0, until: now + seconds * 1000 };
  if (++entry.count > max)
    throw new AppError('For mange førespurnader. Vent litt og prøv igjen.', 429);
  local.set(key, entry);
}
