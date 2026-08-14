# Local Docker Dev

Optional local development stack: Postgres + Redis + backend, all in containers.
This does NOT replace your normal workflow � pnpm dev + hosted Supabase still works exactly as before, untouched.

## Setup

1. Copy the example env file:
   `cp apps/backend/.env.docker.example apps/backend/.env.docker`
2. Start the stack:
   `docker compose up --build`
3. Backend available at http://localhost:4000, health check: http://localhost:4000/health

## Notes

- Postgres runs on host port 5433 (not 5432, to avoid clashing with any native Postgres install). Internally still 5432.
- Postgres schema is seeded automatically on first run from docker/postgres-init/00_extensions.sql and supabase/migrations/*.sql � these are mounted directly, not copied, so they always match Supabase's schema.
- Backend source (apps/backend/src) is bind-mounted, so code changes hot-reload via nodemon inside the container � no rebuild needed for code edits. Rebuild (--build) only if you change package.json or the Dockerfile.
- To reset the database completely (re-run all migrations from scratch): docker compose down -v
