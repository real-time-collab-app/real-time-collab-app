-- Enables gen_random_uuid(), used as the default for all primary key columns
-- across our schema (see supabase/migrations/*.sql). Supabase's hosted
-- Postgres has this enabled by default; a vanilla postgres Docker image
-- does not, so we enable it explicitly for local dev parity.
CREATE EXTENSION IF NOT EXISTS pgcrypto;