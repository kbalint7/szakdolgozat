import { execFileSync } from 'node:child_process';

import { loadEnvConfig } from '@next/env';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

export default async function globalSetup() {
  loadEnvConfig(process.cwd(), false, { info: () => {}, error: console.error });
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL is not set (see .env.example)');
  if (process.env.E2E_BASE_URL) return;

  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    await pool.query(
      'drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;',
    );
    await migrate(drizzle(pool), { migrationsFolder: './drizzle' });
  } finally {
    await pool.end();
  }

  execFileSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'db/seed.ts'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url, SEED_WRITE_TOOLS_ENV: '0', LOG_LEVEL: 'silent' },
  });
}
