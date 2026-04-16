# Data sources:

Thanks to:

openweathermaps.org

smhi.se

weatherapi.com

# Usage

*If you wish to host this API for yourself you will need API keys for certain services, see .env.example.*

**Start this app up using docker:**

```
docker compose build
docker compose up
```

**Start the development environment using docker:**

Full containerised dev (DB + API with hot-reload):

```bash
npm run docker:dev
```

Or run only the DB in Docker and the app natively (requires `DB_HOST=localhost` in `.env`):

```bash
docker compose -f docker-compose.dev.yml up db -d
npm run start:dev
```

# Endpoints

### (GET) **/** 

Get app- and contact info

### (GET) **/test**

Test if the api is running

### (GET) **/cv**

Returns my CV as a pdf

### (GET) **/ip-location**

Gets the location related to your IP address

### (GET) **/weather**

Combines these two requests, you can use the same query as described in the docs (but without appid)

https://openweathermap.org/current

https://openweathermap.org/forecast5

### (GET) **/weather/pollution**

Combines these current and forecast requests, you can use the same query as described in the docs (but without appid)

https://openweathermap.org/api/air-pollution

### (GET) **/v1/weather**

Aggregates current weather, forecast, pollution, and local weather warnings from multiple sources (openweathermap.org, weatherapi.com, smhi.se). Supports the same `lat`/`lon` query parameters, plus `days` (1–6, default 5) and `units` (`imperial` or `metric`, defaults to `metric`).

---

## Authentication

The API uses a two-step email-based authentication flow that issues a short-lived JWT stored in an HTTP-only cookie.

**Flow:**

1. `POST /v1/auth/login` — Submit the admin password. On success, a 6-digit verification code is emailed to `ADMIN_EMAIL` and a `sessionToken` is returned.
2. `POST /v1/auth/verify` — Submit the `sessionToken` and the `code` received by email. On success, a signed JWT (valid for 3 hours) is set as an HTTP-only cookie named `jwt_token`.
3. `GET /v1/auth/verify-token` — Check whether the JWT cookie is still valid.
4. `POST /v1/auth/logout` — Clear the JWT cookie to log out.

### (POST) **/v1/auth/login**

Initiates login. Requires the admin password in the request body.

**Body:**
```json
{ "password": "your_admin_password" }
```

**Response (200):**
```json
{
  "message": "Verification code sent to email",
  "sessionToken": "<token>",
  "expiresIn": 600
}
```

### (POST) **/v1/auth/verify**

Verifies the emailed code and sets the JWT as an HTTP-only cookie.

**Body:**
```json
{ "sessionToken": "<token>", "code": "123456" }
```

**Response (200):**
```json
{
  "message": "Authentication successful",
  "expiresIn": "3h"
}
```

**Set-Cookie:** `jwt_token=<jwt>; HttpOnly; Secure; SameSite=Strict`

### (GET) **/v1/auth/verify-token**

Checks whether the JWT cookie is still valid.

**Cookie:** `jwt_token=<jwt>` (sent automatically by browser)

**Response (200):**
```json
{ "message": "Token is valid" }
```

### (POST) **/v1/auth/logout**

Clears the JWT cookie.

**Response (200):**
```json
{ "message": "Logged out successfully" }
```

---

## Logs

### (GET) **/v1/logs**

Retrieves paginated request logs. Requires JWT authentication via HTTP-only cookie.

**Cookie:** `jwt_token=<jwt>` (sent automatically by browser)

**Query Parameters:**
- `page` (optional) — Page number (default: 1). Each page returns up to 100 logs.
- `search` (optional) — Case-insensitive text search across the `route`, `ip`, and `description` fields.
- `code` (optional) — Filter by one or more HTTP status codes. Use either a single value like `?code=401` or repeat the parameter like `?code=400&code=401`.

**Examples:**
- `/v1/logs?page=2`
- `/v1/logs?search=token`
- `/v1/logs?code=401`
- `/v1/logs?code=400&code=401&search=auth`

**Response (200):**
```json
{
  "data": [
    {
      "id": 31,
      "ip": "::ffff:172.20.0.1",
      "method": "GET",
      "route": "/v1/logs",
      "description": "Invalid token",
      "code": 401,
      "type": "WARN",
      "created_at": "2026-04-14T12:37:03.966Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 100,
    "totalPages": 5,
    "totalCount": 432
  }
}
```

### (GET) **/v1/logs/meta**

Returns the available log fields that can be queried through the meta endpoint family. Requires JWT authentication via HTTP-only cookie.

**Cookie:** `jwt_token=<jwt>` (sent automatically by browser)

**Response (200):**
```json
{
  "data": {
    "resource": "Log",
    "values": [
      "id",
      "ip",
      "method",
      "route",
      "description",
      "code",
      "type",
      "created_at"
    ],
    "count": 8
  }
}
```

### (GET) **/v1/logs/meta/:field**

Returns the distinct values for a single log field. Requires JWT authentication via HTTP-only cookie.

Max 1000 values will be returned, limited tells if amount of data was limited

**Cookie:** `jwt_token=<jwt>` (sent automatically by browser)

**Route Parameters:**
- `field` — A valid log field name returned by `/v1/logs/meta`.

**Example:**
- `/v1/logs/meta/code`

**Response (200):**
```json
{
  "data": {
    "field": "code",
    "values": [200, 400, 401, 500],
    "count": 4,
    "limited": false 
  }
}
```

**Response (404):**
```json
{
  "code": 404,
  "message": "Field not found for the requested resource"
}
```
