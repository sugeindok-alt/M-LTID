import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import type { Database } from '@/db';
import * as schema from '@/db/schema';
export async function testDatabase() {
  const client = new PGlite();
  const testDb = drizzle(client, { schema });
  await migrate(testDb, { migrationsFolder: './drizzle' });
  // Same Drizzle PostgreSQL schema/queries, embedded PostgreSQL test transport.
  return { client, db: testDb as unknown as Database };
}
