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
npm test                                                                                   # full suite
npm test -- --runTestsByPath src/tests/cache.middleware.test.mjs --runInBand               # single file
npm test -- --runTestsByPath src/tests/cache.middleware.test.mjs --runInBand -t "returns a cached response when Redis has a value"  # single test
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

**Weather endpoint** (`GET /v1/weather`) is a multi-provider aggregation pipeline with a 10-minute Redis response cache:
- The controller calls `weatherAggregatorService.allWeather()` which fetches all six provider APIs in a single `Promise.allSettled` pass (OWM current + forecast, WeatherAPI current + forecast, SMHI, MET) to avoid duplicate calls
- Each provider normalizes its response via `src/dtos/*.dto.mjs` into a shared shape; DTOs use ISO date strings (`YYYY-MM-DD`) as forecast day keys internally, which the aggregator converts to weekday names at the response boundary
- `src/services/weatherAggregator.service.mjs` merges results: averages overlapping numeric fields, has custom precipitation-window merging, and returns partial data when some providers fail
- Weather warnings are geo-routed: `src/utils/geoHelpers.mjs` uses ray-casting against GeoJSON borders in `src/data/borders/` to determine if coordinates are in Sweden (→ SMHI) or Norway (→ MET/Yr); all other coordinates use WeatherAPI. The provider/DTO pair is defined in `src/utils/localWeatherProviders.mjs`
- Pollution data (`currentPollution`) comes exclusively from OpenWeatherMaps with no aggregation

**Authentication** is a two-step email flow backed by Redis:
1. `POST /v1/auth/login` — validates admin password, stores a 6-digit code + session token in Redis (10-minute TTL), emails the code via Resend
2. `POST /v1/auth/verify` — validates session token + code, deletes the one-time Redis session, sets a signed JWT in an HTTP-only cookie (`jwt_token`, 3h TTL)
- Login is rate-limited (10 req / 15 min) using `express-rate-limit` with a Redis store; in-memory store when `NODE_ENV=test`
- Protected endpoints use an `authenticate` middleware that reads the JWT cookie

**Request logging** is asynchronous and two-stage:
- `src/middleware/log.middleware.mjs` queues structured log payloads into Redis after each response
- `src/jobs/flush-request-logs.mjs` flushes the queue to Postgres in batches with a Redis lock (avoids concurrent flushers); uses `bulkCreate(..., { ignoreDuplicates: true })` with `stable_id` for deduplication
- `src/middleware/handleError.middleware.mjs` records uncaught errors synchronously to `error_logs`
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
- `src/services/redis.service.mjs` exposes a `withCache(key, ttl, fn)` helper for programmatic caching; the `cache(duration)` middleware in `src/middleware/cache.middleware.mjs` wraps `res.send` to cache full HTTP responses by URL.

## Adding a country warning provider

Weather warnings are separate from the aggregation pipeline. The controller calls `getCoordinateBound(lat, lon)` from `src/utils/geoHelpers.mjs`, which ray-casts against every border in `bordersArray` and returns the matching `{ country, provider }` entry. The controller then calls `provider.service.weatherWarnings(lat, lon)` → `provider.dto.weatherWarnings(data)`.

To add a new country (e.g. Finland):
1. Add `src/data/borders/FI.json` — a GeoJSON Polygon or MultiPolygon for the country boundary.
2. Add an entry to `src/utils/localWeatherProviders.mjs` mapping the country code to `{ name, service, dto }`.
3. Add `weatherWarnings` to the country's service (HTTP fetch, returns raw provider response).
4. Add `weatherWarnings` to the country's DTO (normalise to `{ severity, severityDescription, title, description, type, warningsCount, raw, provider }`). SMHI and MET DTOs are the reference implementations.
5. Add the new border to `bordersArray` in `src/utils/geoHelpers.mjs`.

Coordinates that don't match any border fall through to the WeatherAPI global fallback, which has no `weatherWarnings` implementation — the controller catches the resulting error and returns `null` for warnings.

SMHI and MET serve a dual role: they contribute forecast/current data to the aggregator (`weatherAggregator.service.mjs`) independently of also being warning providers. Adding a new country's warning provider does not automatically include it in the aggregation pipeline.
