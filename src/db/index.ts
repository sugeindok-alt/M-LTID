import 'server-only';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from './schema';
export function createDatabase(url: string) {
  neonConfig.webSocketConstructor = WebSocket;
  return drizzle(new Pool({ connectionString: url, max: 5 }), { schema });
}
export type Database = ReturnType<typeof createDatabase>;
let database: Database | undefined;
export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_NOT_CONFIGURED');
  return (database ??= createDatabase(process.env.DATABASE_URL));
}
