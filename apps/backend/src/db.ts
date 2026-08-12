import { Pool } from "pg";

/**
 * Shared Postgres connection pool, used across all route handlers.
 * DATABASE_URI comes from .env (Supabase session pooler connection string —
 * see RTC-17 notes on why the session pooler is used instead of direct connection).
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URI,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle Postgres client", err);
});