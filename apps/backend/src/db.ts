import { Pool } from 'pg';

/**
 * Shared Postgres connection pool, used across all route handlers.
 * DATABASE_URL comes from .env (Supabase session pooler connection string —
 * see RTC-17 notes on why the session pooler is used instead of direct connection).
 */

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Check your .env file.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(1);
});