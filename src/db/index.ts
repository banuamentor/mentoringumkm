import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });

/**
 * Automatically synchronizes all PostgreSQL table sequences with their max(id).
 * This prevents "duplicate key value violates unique constraint" on tables seeded with explicit IDs.
 */
export const ensureSequencesSynced = async (): Promise<void> => {
  const p = createPool();
  try {
    await p.query(`
      DO $$
      DECLARE
          r RECORD;
      BEGIN
          FOR r IN (
              SELECT table_name, column_name, pg_get_serial_sequence(quote_ident(table_name), quote_ident(column_name)) AS seq_name
              FROM information_schema.columns
              WHERE table_schema = 'public' 
                AND column_default LIKE 'nextval%'
          ) LOOP
              IF r.seq_name IS NOT NULL THEN
                  EXECUTE format('SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I), 1) + 1, false)', r.seq_name, r.column_name, r.table_name);
              END IF;
          END LOOP;
      END $$;
    `);
    console.log('✅ PostgreSQL sequence counters synced successfully');
  } catch (err) {
    console.warn('Notice: Sequence sync warning (ignorable if tables not created yet):', err);
  }
};
