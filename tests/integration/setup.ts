import { loadEnvConfig } from '@next/env';
import { afterAll, beforeEach } from 'vitest';

loadEnvConfig(process.cwd(), false, { info: () => {}, error: console.error });
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.LOG_LEVEL = process.env.TEST_LOG_LEVEL ?? 'silent';

(globalThis as { pgPool?: unknown }).pgPool = undefined;
const { pool } = await import('@/db/drizzle');

beforeEach(async () => {
  const { rows } = await pool.query<{ tablename: string }>(
    "select tablename from pg_tables where schemaname = 'public'",
  );
  await pool.query(`truncate ${rows.map(row => `"${row.tablename}"`).join(', ')} restart identity cascade`);
});

afterAll(async () => {
  await pool.end();
});
