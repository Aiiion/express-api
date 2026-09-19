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

**Lint / format** — Biome (`biome.json`) is the single linter, formatter, and import sorter; CI runs `biome ci` as a separate job:
```bash
npm run lint             # check formatting, lint rules, and import order (no changes)
npm run lint:fix         # apply safe fixes + formatting
npm run format           # formatting only
```

There is no build script.

## Architecture

**Entrypoint:** `src/index.mjs` builds the Express app, applies middleware (helmet, JSON, cookie-parser, request logger, global error handler), mounts routes, then `start()` connects Postgres + Redis, initializes Sequelize models, and registers cron jobs. The server does not auto-start when `NODE_ENV=test` — most test files call `start(0)` themselves.

**Routing** is composed in `src/routes/index.route.mjs`. Route modules (not controllers) own request-level concerns: they compose `checkSchema(...)`, `validateResult`, CORS, and auth middleware before handing off to a controller. Validation schemas are shared from `src/utils/validationSchemas.mjs`.

**CORS** is per-route, not global. `src/utils/corsHelpers.mjs` reads `CORS_ALLOWLIST` (comma-separated). Requests without an `Origin` pass as non-CORS; disallowed origins get a 403-style error.

**Weather endpoint** (`GET /v1/weather`) is a multi-provider aggregation pipeline with a 10-minute Redis response cache:
- The controller calls `weatherAggregatorService.allWeather()` which fetches all four provider APIs in a single `Promise.allSettled` pass (WeatherAPI current + forecast, SMHI, MET) to avoid duplicate calls. OpenWeatherMap is **not** a forecast provider — it only supplies pollution data
- Each provider normalizes its response via `src/dtos/*.dto.mjs` into a shared shape; DTOs use ISO date strings (`YYYY-MM-DD`) as forecast day keys internally, which the aggregator converts to weekday names at the response boundary
- `src/services/weatherAggregator.service.mjs` merges results: averages overlapping numeric fields, has custom precipitation-window merging, and returns partial data when some providers fail
- Every DTO stamps an entry's precipitation as the period *starting* at `dt` (`[dt, dt + hours_measured)`), which is what the aggregator assumes. WeatherAPI and MET report that way natively; SMHI (`time` closes the interval begun at `intervalParametersStartTime`) stamps at the *end*, so its forecast DTO hands each entry the following entry's precipitation and drops the final entry, which has no successor
- Precipitation is merged by **rate**, not by raw total. `adjustPrecipitationAcrossHours` buckets hours into windows the width of the coarsest provider's period on the UTC grid, averages each source's mm/h over the window (a source absent from the window is skipped; a source forecasting 0 mm counts), then redistributes `rate × hours` across the window's entries — where `hours` counts only the window's hourly slots that fall inside the local day and are still ahead of now, since local days don't align with the UTC grid and a straddling window must not be credited to both days. `hours_measured` on the output states how many of those hours each entry stands for, so a window with fewer entries than hours keeps its total intact. An entry's `type` is taken from the sources that forecast precipitation in the window, and is `'none'` whenever its `amount` is 0
- Weather condition text is merged by consensus over a shared vocabulary, not by string comparison. Each DTO maps its provider's *structured* code — WeatherAPI `condition.code`, SMHI Wsymb2, MET `symbol_code` — onto a `condition` code from `src/utils/weatherConditions.mjs`; the aggregator takes a majority vote on the condition's coarse `group` (with three voters a tie means one is missing — SMHI has no coverage outside the Nordics — or all three differ; a dry-versus-wet tie is settled by the voters' own precipitation amounts — ≥ 0.1 mm/h counts as wet — so the condition never contradicts the amount beside it; what the amounts can't separate goes to the more severe group per `GROUP_SEVERITY`, never to whichever provider is listed first), then the median intensity `rank` within it, sources `weather`/`description` from a provider that agreed, and builds `icon` from the consensus condition in WeatherAPI's URL format (`weatherApiIconFor`; day/night is read from WeatherAPI's icon URL, so it is null when only SMHI/MET responded). Never map from a provider's display text — the three vocabularies share no strings
- Weather warnings are geo-routed: `src/utils/geoHelpers.mjs` uses ray-casting against GeoJSON borders in `src/data/borders/` to determine if coordinates are in Sweden (→ SMHI), Norway (→ MET/Yr), or Finland (→ FMI); all other coordinates use WeatherAPI. The provider/DTO pair is defined in `src/utils/localWeatherProviders.mjs`
- Pollution data (`currentPollution`) comes exclusively from OpenWeatherMap with no aggregation; this is the only thing `OWM_API_KEY` is still used for

**Authentication** is a two-step email flow backed by Redis:
1. `POST /v1/auth/login` — validates admin password, stores a 6-digit code + session token in Redis (10-minute TTL), emails the code via Resend
2. `POST /v1/auth/verify` — validates session token + code, deletes the one-time Redis session, sets a signed JWT in an HTTP-only cookie (`jwt_token`, 3h TTL)
- Login is rate-limited (10 req / 15 min) using `express-rate-limit` with a Redis store; in-memory store when `NODE_ENV=test`
- Protected endpoints use an `authenticate` middleware that reads the JWT cookie

**Locations** (`/v1/locations`) is the one client-writable resource: named coordinates anyone can save so others can feed them to `/v1/weather`. There are no user accounts, so rows have no owner — `GET` index/show and `POST` are public (POST is rate-limited per IP, 30 / 15 min), while `PATCH`, `DELETE` and the `/meta` routes require the admin JWT. Each row has two required labels: `name` (what the user typed, the unique key) and `provider_name`, which the frontend sets on its own (e.g. the weather provider's place name) — free text, no uniqueness, matched by `?search=` alongside `name`. Both share `createNameRules` in `validationSchemas.mjs`. Names are unique case-insensitively via a functional index on `lower(name)` (`uq_locations_name_lower`, created with raw SQL in the migration — a column-level `unique` would be case-sensitive); the controller relies on the resulting `UniqueConstraintError` for its 409 rather than a racy pre-check. Coordinates are `DOUBLE` (not `DECIMAL`, which `pg` returns as strings) and go through the same 3-decimal rounding as weather requests. Because public and cookie-authenticated routes share one prefix, the route module mounts a single CORS delegate that picks open (`origin: '*'`) or allowlist+credentials per path and method — for a preflight it reads `Access-Control-Request-Method`; two stacked `cors()` mounts would overwrite each other's headers.

**Request logging** is asynchronous and two-stage:
- `src/middleware/log.middleware.mjs` queues structured log payloads into Redis after each response
- `src/jobs/flush-request-logs.mjs` flushes the queue to Postgres in batches with a Redis lock (avoids concurrent flushers); uses `bulkCreate(..., { ignoreDuplicates: true })` with `stable_id` for deduplication
- `src/middleware/handleError.middleware.mjs` records uncaught errors synchronously to `error_logs`
- `src/jobs/purge-old-logs.mjs` removes old rows from both `request_logs` and `error_logs`
- `src/cron.mjs` schedules flushing every 2 minutes, purging daily at 05:00 UTC, reference station polling at 12:00 UTC, and accuracy evaluation at 06:00 UTC

**Provider accuracy evaluation** tracks forecast accuracy per provider and country (SE/NO/FI/GL) to support future weighted aggregation:
- On every `allWeather()` call, `src/services/forecastSnapshot.service.mjs` fire-and-forgets a snapshot of each provider's next-day prediction into `provider_forecast_snapshots` (keyed on `provider, lat, lon, valid_for`; coordinates rounded to 2 decimal places to collapse near-duplicate requests)
- `src/jobs/poll-reference-stations.mjs` calls `allWeather()` daily at 12:00 UTC for 13 fixed station coordinates in `src/data/referenceStations.mjs` (SE/NO/FI spread) to accumulate data independent of user traffic; station coordinates are used so the nearest-station observation lookup returns exactly that station
- `src/jobs/evaluate-provider-accuracy.mjs` runs daily at 06:00 UTC: fetches real observations for yesterday's unevaluated snapshots, persists the observed values (`obs_avg_temp`, `obs_total_precip`, `obs_avg_wind_speed`, `obs_avg_humidity`) directly on each snapshot row, then recomputes MAE over the past 30 days of evaluated snapshots and upserts into `provider_accuracy_scores` per `(provider, country_code)`. Storing obs values on the snapshot makes each row self-contained so older rows in the window don't require re-fetching historical observations.
- Observation ground truth by country: SE → SMHI metobs API (`src/services/observations/smhiObs.service.mjs`, station list cached 24h in Redis); NO → Frost API with Basic auth (`src/services/observations/frostObs.service.mjs`, `nearest(POINT(...))` query); FI → FMI WFS via existing `fetchWfsBsSimple` (`src/services/observations/fmiObs.service.mjs`); global → Open-Meteo ERA5 archive (`src/services/observations/openMeteoArchive.service.mjs`)
- `country_code` uses 2-letter ISO codes; `'GL'` is the sentinel for coordinates outside SE/NO/FI

**Database** uses both `pg` and Sequelize. `src/services/infrastructure/db.service.mjs` owns the low-level `pg` connectivity check. `src/models/index.mjs` creates the Sequelize instance. Schema is managed entirely through migrations in `src/db/migrations/` — `sequelize.sync()` is never used.

**Response shape conventions:**
- Errors: `{ code, message }`
- Single resource: `{ data: ... }`
- Lists: `{ data: [...], pagination: { page, perPage, totalPages, totalCount } }`

## Key conventions

- All source files use ESM `.mjs`. Tests that mock modules use `jest.unstable_mockModule(...)` and only import the module under test *after* the mock is set up.
- Read validated input with `matchedData(req)`, never `req.query`. Express 5's `req.query` is a getter that re-parses the URL on every access, so express-validator's sanitized values (`toInt`, rounding, `units` → boolean, defaults) never land on it. Also, a field marked `optional` skips its whole chain when absent — `default` included — so give a field a `default` *or* mark it `optional`, not both.
- Services are organized into subfolders: `src/services/infrastructure/` (db, email, redis), `src/services/observations/` (smhiObs, frostObs, fmiObs, openMeteoArchive), `src/services/providers/` (smhi, met, fmi, openWeatherMaps [pollution only], weatherApi). `weatherAggregator.service.mjs` and `forecastSnapshot.service.mjs` live at the `src/services/` root.
- Fixtures (`src/fixtures/`) and DTOs (`src/dtos/`) pair one-to-one per weather provider (the OpenWeatherMap fixture only holds pollution responses and has no DTO). A DTO feeding the aggregator must emit a `condition` code from `src/utils/weatherConditions.mjs`; without it the provider abstains from the condition vote and falls back to generic string merging.
- Request coordinates are rounded to 3 decimals (~110 m) by `latLonValidationSchema` so GPS jitter shares cache entries, while staying inside one grid cell of the finest provider model. `forecastSnapshot.service.mjs` rounds to 2 decimals separately and deliberately — that key exists to pool near-duplicate requests for accuracy statistics, not to serve a forecast.
- `src/data/borders/` contains geographic boundary data used by geo helpers for weather warning region checks.
- `src/data/referenceStations.mjs` lists the 13 fixed station coordinates used by the daily accuracy poll; coordinates are sourced from real station positions (SMHI metobs, Frost, FMI) so observation lookups resolve to exactly those stations.
- `src/services/infrastructure/redis.service.mjs` exposes a `withCache(key, ttl, fn)` helper for programmatic caching; the `cache(duration)` middleware in `src/middleware/cache.middleware.mjs` wraps `res.send` to cache full HTTP responses by URL. Don't put it on a route whose data the API itself mutates (e.g. the locations index) — there is no invalidation hook.
- Per-IP rate limits come from `createRateLimiter({ windowMs, max, prefix, message })` in `src/middleware/rateLimit.middleware.mjs` (Redis store outside `NODE_ENV=test`). `prefix` is mandatory and must be unique per limiter: `rate-limit-redis` defaults every store to `rl:`, so two limiters without their own prefix would share one counter.
- `createLatLonValidationSchema({ location, optional })` in `src/utils/validationSchemas.mjs` builds the lat/lon rules for either `query` or `body`; `latLonValidationSchema` is the query default. `idParamValidationSchema` validates a positive-integer `:id` route param.

## Adding a country warning provider

Weather warnings are separate from the aggregation pipeline. The controller calls `getCoordinateBound(lat, lon)` from `src/utils/geoHelpers.mjs`, which ray-casts against every border in `bordersArray` and returns the matching `{ country, provider }` entry. The controller then calls `provider.service.weatherWarnings(lat, lon)` → `provider.dto.weatherWarnings(data)`.

To add a new country (e.g. Finland):
1. Add `src/data/borders/FI.json` — a GeoJSON Polygon or MultiPolygon for the country boundary.
2. Add an entry to `src/utils/localWeatherProviders.mjs` mapping the country code to `{ name, service, dto }`.
3. Add `weatherWarnings` to the country's service (HTTP fetch, returns raw provider response).
4. Add `weatherWarnings` to the country's DTO (normalize to `{ severity, severityDescription, title, description, type, warningsCount, raw, provider }`). SMHI and MET DTOs are the reference implementations.
5. Add the new border to `bordersArray` in `src/utils/geoHelpers.mjs`.

Coordinates that don't match any border fall through to the WeatherAPI global fallback, which has no `weatherWarnings` implementation — the controller catches the resulting error and returns `null` for warnings.

SMHI and MET serve a dual role: they contribute forecast/current data to the aggregator (`weatherAggregator.service.mjs`) independently of also being warning providers. Adding a new country's warning provider does not automatically include it in the aggregation pipeline.
