# Dev-mode Dockerfile for local Docker Compose only.
# Not intended for production use — runs pnpm dev (nodemon + ts-node) with
# hot-reload via a bind-mounted volume, defined in docker-compose.yml.
#
# Using node:24-slim (Debian/glibc) rather than node:24-alpine (musl):
# bcrypt's prebuilt binaries target glibc and are known to be unreliable
# or require a from-source rebuild on Alpine's musl libc.

FROM node:24-slim

# Enable corepack so the pinned pnpm version (see root package.json's
# "packageManager" field) is used inside the container too — avoids version
# drift between host and container, same reasoning as our CI setup.
RUN corepack enable

WORKDIR /app

# Copy workspace-level files first so dependency installation is a separate,
# cacheable Docker layer — source code changes won't force a full reinstall.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/backend/package.json apps/backend/tsconfig.json ./apps/backend/

RUN pnpm install --frozen-lockfile

# Actual source code is bind-mounted at runtime via docker-compose.yml,
# so we don't COPY apps/backend/src here — this keeps the image lean and
# means host-side edits are reflected without rebuilding the image.

WORKDIR /app/apps/backend

EXPOSE 4000

CMD ["pnpm", "dev"]