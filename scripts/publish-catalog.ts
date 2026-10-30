import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import { recipeCatalog } from '../src/db/schema';
import { catalogSnapshot } from '../src/data/catalog';
const envPath = process.argv[2];
if (!envPath) throw new Error('Oppgi miljøfila som argument. Ho blir ikkje skriven til loggen.');
const env = parse(readFileSync(envPath));
const url = new URL(env.DATABASE_URL);
url.hostname = url.hostname.replace('-pooler.', '.');
neonConfig.webSocketConstructor = WebSocket;
const pool = new Pool({ connectionString: url.href, max: 1 });
const db = drizzle(pool);
try {
  const before = await db.execute(
    sql`select (select count(*) from users)::int as users, (select count(*) from favorites)::int as favorites`,
  );
  await migrate(db, { migrationsFolder: './drizzle' });
  await db.transaction(async (tx) => {
    for (const recipe of catalogSnapshot)
      await tx
        .insert(recipeCatalog)
        .values({ id: recipe.id, data: recipe })
        .onConflictDoUpdate({
          target: recipeCatalog.id,
          set: { data: recipe, updatedAt: new Date() },
        });
  });
  const after = await db.execute(
    sql`select (select count(*) from users)::int as users, (select count(*) from favorites)::int as favorites`,
  );
  if (JSON.stringify(before.rows) !== JSON.stringify(after.rows))
    throw new Error('Kontroller endringar i brukarar og favorittar.');
  console.log(
    `Publisert ${catalogSnapshot.length} katalogoppføringar. Brukarar og favorittar er bevarte.`,
  );
} catch {
  console.error('Katalogpublisering feila. Ingen tilkoplingsdata blir logga.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
