// Run only reviewed Drizzle migrations; never seed or replace personal data.
import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
const envFile = process.argv[2];
if (!envFile) throw new Error('Oppgi privat miljøfil.');
const url = new URL(parse(readFileSync(envFile)).DATABASE_URL);
url.hostname = url.hostname.replace('-pooler.', '.');
neonConfig.webSocketConstructor = WebSocket;
const pool = new Pool({ connectionString: url.href, max: 1 });
try {
  await migrate(drizzle(pool), { migrationsFolder: './drizzle' });
  console.log('Migreringane er på plass.');
} catch {
  console.error('Migreringa feila. Tilkoplingsdata er ikkje logga.');
  process.exitCode = 1;
} finally {
  await pool.end();
}
