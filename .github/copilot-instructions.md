# Copilot Instructions

## Build, test, and run commands

- **Runtime**: Node.js 24+, ESM modules (`"type": "module"` in `package.json`).
- **Full containerized development**: `npm run docker:dev`
- **Run app natively against Dockerized Postgres + Redis**:
  `docker compose -f docker-compose.dev.yml up db redis -d && npm run start:dev`
  - When running the app natively, use `DB_HOST=localhost` and `REDIS_URL=redis://localhost:6379` as described in `README.md` / `.env.example`.
- **Start production-style server**: `npm start`
- **Database commands**:
  - `npm run migrate`
  - `npm run migrate:down`
  - `npm run db:seed`
  - `npm run db:seed:undo`
- **Full test suite**: `npm test`
  - The integration-style suites start the real app with `start(0)`, so Postgres must be reachable first. In CI the sequence is: run migrations, run seeders, then run `npm test`.
- **Single test file**:
  `npm test -- --runTestsByPath src/tests/cache.middleware.test.mjs --runInBand`
- **Single test by name**:
  `npm test -- --runTestsByPath src/tests/cache.middleware.test.mjs --runInBand -t "returns a cached response when Redis has a value"`
- **Lint/build**: there are currently no dedicated lint or build scripts in `package.json`.

## High-level architecture

- `src/index.mjs` is the application entrypoint. It builds the Express app, applies `helmet`, JSON parsing, cookie parsing, request logging, and the global error handler. CORS is applied per-route, not globally. `start()` then connects Postgres and Redis, initializes Sequelize models, authenticates Sequelize, and registers cron jobs.
- Routing is composed in `src/routes/index.route.mjs`. Top-level routes cover:
  - info endpoints (`/`, `/test`, `/cv`, `/ip-location`)
  - auth endpoints (`/v1/auth/*`)
  - weather (`/v1/weather`)
  - request/error log resources plus `/meta` endpoints
  - `/v1` discovery/index endpoint
- The weather endpoint is a multi-provider aggregation pipeline, not a thin proxy:
  - controller: `src/controllers/v1/weather.controller.mjs`
  - provider clients: `src/services/openWeatherMaps.service.mjs`, `src/services/weatherApi.service.mjs`, `src/services/smhi.service.mjs`, `src/services/met.service.mjs`
  - normalization layer: `src/dtos/*.dto.mjs`
  - merge/orchestration: `src/services/weatherAggregator.service.mjs`
  The aggregator fetches providers in parallel, normalizes them into a shared DTO shape, averages overlapping numeric fields, has custom precipitation-window merging logic, and logs provider failures while still returning partial weather data when possible.
- Logging is split between request logs and error logs:
  - `src/middleware/log.middleware.mjs` captures the final response and queues structured request-log payloads into Redis.
  - `src/jobs/flush-request-logs.mjs` flushes queued request logs from Redis into Postgres in batches, with a Redis lock to avoid concurrent flushers.
  - `src/middleware/handleError.middleware.mjs` records uncaught errors to `error_logs`.
  - `src/jobs/purge-old-logs.mjs` removes old rows from both `request_logs` and `error_logs`.
  - `src/cron.mjs` schedules request-log flushing every 2 minutes and log purging daily at 05:00 UTC.
- Authentication is a two-step email flow backed by Redis:
  - `POST /v1/auth/login` validates the admin password, creates a 6-digit verification code plus session token, stores them in Redis for 10 minutes, and sends the code by email through Resend. This endpoint is rate-limited (10 requests per 15 minutes) using `express-rate-limit` with a Redis store (in-memory store in test mode).
  - `POST /v1/auth/verify` validates the session token + code, deletes the one-time Redis session, and sets a signed JWT in the `jwt_token` HTTP-only cookie for 3 hours.
  - `GET /v1/auth/verify-token` checks that the current JWT cookie is valid.
  - `POST /v1/auth/logout` clears the JWT cookie.
  - Protected log endpoints use the `authenticate` middleware, which reads the JWT from that cookie.
- Postgres access uses both `pg` and Sequelize:
  - `src/services/db.service.mjs` owns the low-level `pg` connectivity check used during startup.
  - `src/models/index.mjs` creates the Sequelize instance.
  - Model definitions are initialized explicitly at runtime; schema changes are handled through `src/db/migrations/`, not `sequelize.sync()`.

## Key conventions

- The codebase is all-in on ESM `.mjs`. Tests that mock modules use `jest.unstable_mockModule(...)` and only import the module under test afterward.
- Route modules own request concerns: they usually compose `checkSchema(...)`, `validateResult`, env guards/auth middleware, and route-specific CORS before handing off to a controller.
- Validation uses shared `express-validator` schema objects from `src/utils/validationSchemas.mjs` rather than inline checks in controllers.
- CORS is strict and allowlist-based. `src/utils/corsHelpers.mjs` reads a comma-separated `CORS_ALLOWLIST`; requests without an `Origin` are treated as non-CORS, and disallowed origins fail with a 403-style CORS error instead of being silently allowed.
- Request logging is intentionally asynchronous. New request logs are queued in Redis first, then persisted later by the flush job. `request_logs.stable_id` is used for deduplication, and the flusher uses `bulkCreate(..., { ignoreDuplicates: true })`.
- Test mode changes infrastructure behavior:
  - `src/index.mjs` does not auto-start the server in test mode, but many tests still call `start(0)` themselves, so Postgres and Redis must be reachable for the full suite.
  - The login rate limiter in `src/routes/v1/auth.route.mjs` uses an in-memory store instead of Redis when `NODE_ENV === "test"`.
- Error responses usually follow the repository shape `{ code, message }`. Successful resource responses typically wrap payloads in `{ data: ... }`, and list endpoints also return a `pagination` object.
