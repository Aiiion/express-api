# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
```bash
# Full containerized dev (DB + API with hot-reload)
npm run docker:dev

# Run only DB and Redis in Docker, app natively (requires DB_HOST=localhost and REDIS_URL=redis://localhost:6379 in .env)
docker compose -f docker-compose.dev.yml up db redis -d && npm run start:dev
```

**Tests** — Postgres and Redis must be reachable; run migrations and seeders first:
```bash
npm run migrate && npm run db:seed
npm test                                                          # full suite
npm test -- --runTestsByPath src/tests/cache.middleware.test.mjs  # single file
npm test -- --runTestsByPath src/tests/cache.middleware.test.mjs -t "returns a cached response when Redis has a value"  # single test
```

**Database:**
```bash
npm run migrate          # run pending migrations
npm run migrate:down     # rollback last migration
npm run db:seed          # run seeders
npm run db:seed:undo     # undo seeders
```

There are no lint or build scripts.

## Architecture

**Entrypoint:** `src/index.mjs` builds the Express app, applies middleware (helmet, JSON, cookie-parser, request logger, global error handler), mounts routes, then `start()` connects Postgres + Redis, initializes Sequelize models, and registers cron jobs. The server does not auto-start when `NODE_ENV=test` — most test files call `start(0)` themselves.

**Routing** is composed in `src/routes/index.route.mjs`. Route modules (not controllers) own request-level concerns: they compose `checkSchema(...)`, `validateResult`, CORS, and auth middleware before handing off to a controller. Validation schemas are shared from `src/utils/validationSchemas.mjs`.

**CORS** is per-route, not global. `src/utils/corsHelpers.mjs` reads `CORS_ALLOWLIST` (comma-separated). Requests without an `Origin` pass as non-CORS; disallowed origins get a 403-style error.

**Weather endpoint** (`GET /v1/weather`) is a multi-provider aggregation pipeline:
- Four provider clients (`src/services/*.service.mjs`) fetch data in parallel
- Each normalizes its response via `src/dtos/*.dto.mjs` into a shared shape
- `src/services/weatherAggregator.service.mjs` merges results: averages overlapping numeric fields, has custom precipitation-window merging, and returns partial data when some providers fail

**Authentication** is a two-step email flow backed by Redis:
1. `POST /v1/auth/login` — validates admin password, stores a 6-digit code + session token in Redis (10-minute TTL), emails the code via Resend
2. `POST /v1/auth/verify` — validates session token + code, deletes the one-time Redis session, sets a signed JWT in an HTTP-only cookie (`jwt_token`, 3h TTL)
- Login is rate-limited (10 req / 15 min) using `express-rate-limit` with a Redis store; in-memory store when `NODE_ENV=test`
- Protected endpoints use an `authenticate` middleware that reads the JWT cookie

**Request logging** is asynchronous and two-stage:
- `src/middleware/log.middleware.mjs` queues structured log payloads into Redis after each response
- `src/jobs/flush-request-logs.mjs` flushes the queue to Postgres in batches with a Redis lock (avoids concurrent flushers); uses `bulkCreate(..., { ignoreDuplicates: true })` with `stable_id` for deduplication
- `src/jobs/purge-old-logs.mjs` removes old rows from both `request_logs` and `error_logs`
- `src/cron.mjs` schedules flushing every 2 minutes and purging daily at 05:00 UTC

**Database** uses both `pg` and Sequelize. `src/services/db.service.mjs` owns the low-level `pg` connectivity check. `src/models/index.mjs` creates the Sequelize instance. Schema is managed entirely through migrations in `src/db/migrations/` — `sequelize.sync()` is never used.

**Response shape conventions:**
- Errors: `{ code, message }`
- Single resource: `{ data: ... }`
- Lists: `{ data: [...], pagination: { page, perPage, totalPages, totalCount } }`

## Key conventions

- All source files use ESM `.mjs`. Tests that mock modules use `jest.unstable_mockModule(...)` and only import the module under test *after* the mock is set up.
- Fixtures (`src/fixtures/`) and DTOs (`src/dtos/`) pair one-to-one per weather provider.
- `src/data/borders/` contains geographic boundary data used by geo helpers for weather warning region checks.
