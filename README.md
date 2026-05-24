# Data sources:

This api is possible thanks to:

[openweathermaps.org](https://openweathermap.org/)
[smhi.se](https://www.smhi.se/)
[weatherapi.com](https://www.weatherapi.com/)
[met.no](https://www.met.no/)

# Usage

*If you wish to host this API for yourself you will need API keys for certain services, see .env.example.*

**Start this app up using docker:**

```
docker compose up --build
```

**Start the development environment using docker:**

Full containerised dev (DB + API with hot-reload):

```bash
npm run docker:dev
```

Or run only the DB and Redis in Docker and the app natively (requires `DB_HOST=localhost` and `REDIS_URL=redis://localhost:6379` in `.env`):

```bash
docker compose -f docker-compose.dev.yml up db redis -d
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

### (GET) **/v1/weather**

Aggregates current weather, forecast, pollution, and local weather warnings from multiple sources. Supports `lat`/`lon` query parameters, plus `days` (1–6, default 5) and `units` (`imperial` or `metric`, defaults to `metric`).

**Query Parameters:**

| Parameter | Required | Type  | Description |
|-----------|----------|-------|-------------|
| `lat`     | ✅       | float | Latitude (-90 to 90) |
| `lon`     | ✅       | float | Longitude (-180 to 180) |
| `days`    | ❌       | int   | Number of forecast days (1–6, default `5`) |
| `units`   | ❌       | string | Unit system: `metric` (default) or `imperial` |

**Response (200):**
```json
{
  "data": {
    "currentWeather": {
      "weather": "Clear",
      "description": "clear sky",
      "icon": "01d",
      "dt": 1748000000,
      "location": {
        "country_code": "SE",
        "coords": { "lat": 59.33, "lon": 18.07 },
        "name": "Stockholm",
        "timezone": "Europe/Stockholm"
      },
      "temperature": {
        "temp": 18.4,
        "min": 15.2,
        "max": 21.1,
        "feels_like": 17.9
      },
      "pressure": 1015,
      "humidity": 52,
      "visibility": 10000,
      "clouds": { "all": 5 },
      "elevation": {
        "sea_level": 1015,
        "ground_level": 1012
      },
      "wind": {
        "speed": 3.6,
        "deg": 200,
        "dir": "SSW",
        "gust": 5.1
      },
      "precipitation": {
        "amount": 0,
        "hours_measured": 1,
        "type": "none"
      },
      "sunrise": 1748010000,
      "sunset": 1748065000,
      "uv": 4,
      "providers": ["openweathermaps.org", "weatherapi.com", "smhi.se", "met.no"]
    },
    "forecastWeather": {
      "list": {
        "Monday": [
          {
            "dt": 1748001600,
            "weather": "Partly cloudy",
            "description": "Partly cloudy",
            "icon": "03d",
            "temperature": {
              "temp": 17.2,
              "feels_like": 16.8,
              "max": 19.0,
              "min": 15.5
            },
            "pressure": 1013,
            "humidity": 58,
            "elevation": { "sea_level": null, "ground_level": null },
            "wind": {
              "speed": 4.1,
              "deg": 210,
              "dir": "SSW",
              "gust": 6.0
            },
            "clouds": { "all": 40 },
            "visibility": 10000,
            "precipitation": {
              "amount": 0.2,
              "hours_measured": 1,
              "type": "rain"
            }
          }
        ]
      },
      "providers": ["openweathermaps.org", "weatherapi.com", "smhi.se", "met.no"]
    },
    "currentPollution": {
      "coord": { "lon": 18.07, "lat": 59.33 },
      "list": [
        {
          "main": { "aqi": 1 },
          "components": {
            "co": 201.94,
            "no": 0.0,
            "no2": 0.93,
            "o3": 68.66,
            "so2": 0.64,
            "pm2_5": 0.49,
            "pm10": 0.54,
            "nh3": 0.12
          },
          "dt": 1748000000
        }
      ]
    },
    "weatherWarnings": {
      "severity": "YELLOW",
      "severityDescription": "Certain risks to the public. Take extra care in areas susceptible to changing weather.",
      "title": "Wind warning",
      "description": "Strong winds expected this afternoon.",
      "type": "Wind",
      "warningsCount": 1,
      "raw": []
    }
  }
}
```

> **Note:** `weatherWarnings` is `null` if no warnings are active or the location falls outside a supported warning region. Temperature is in °C for `metric` and °F for `imperial`; wind speed in m/s (`metric`) or mph (`imperial`).

---

## V1 API Index

### (GET) **/v1**

Lists all available REST resources and aggregates in the v1 API. Weather is listed separately as an aggregate since it proxies external data sources rather than representing a managed resource.

**Response (200):**
```json
{
  "resources": [
    {
      "name": "RequestLog",
      "endpoint": "/v1/requestLogs",
      "meta": "/v1/requestLogs/meta"
    },
    {
      "name": "ErrorLog",
      "endpoint": "/v1/errorLogs",
      "meta": "/v1/errorLogs/meta"
    }
  ],
  "aggregates": [
    {
      "name": "Weather",
      "description": "Aggregated weather data from multiple external sources",
      "endpoint": "/v1/weather"
    }
  ]
}
```

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

## Request Logs

### (GET) **/v1/requestLogs**

Retrieves paginated request logs. Requires JWT authentication via HTTP-only cookie.

**Cookie:** `jwt_token=<jwt>` (sent automatically by browser)

**Query Parameters:**
- `page` (optional) — Page number (default: 1). Each page returns up to 100 logs.
- `search` (optional) — Case-insensitive text search across the `route`, `ip`, and `description` fields.
- `code` (optional) — Filter by one or more HTTP status codes. Use either a single value like `?code=401` or repeat the parameter like `?code=400&code=401`.

**Examples:**
- `/v1/requestLogs?page=2`
- `/v1/requestLogs?search=token`
- `/v1/requestLogs?code=401`
- `/v1/requestLogs?code=400&code=401&search=auth`

**Response (200):**
```json
{
  "data": [
    {
      "id": 31,
      "ip": "::ffff:172.20.0.1",
      "method": "GET",
      "route": "/v1/requestLogs",
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

### (GET) **/v1/requestLogs/meta**

Returns the available log fields that can be queried through the meta endpoint family. Requires JWT authentication via HTTP-only cookie.

**Cookie:** `jwt_token=<jwt>` (sent automatically by browser)

**Response (200):**
```json
{
  "data": {
    "resource": "RequestLog",
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

### (GET) **/v1/requestLogs/meta/:field**

Returns the distinct values for a single log field. Requires JWT authentication via HTTP-only cookie.

Max 1000 values will be returned, limited tells if amount of data was limited

**Cookie:** `jwt_token=<jwt>` (sent automatically by browser)

**Route Parameters:**
- `field` — A valid log field name returned by `/v1/requestLogs/meta`.

**Example:**
- `/v1/requestLogs/meta/code`

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

---

## Error Logs

### (GET) **/v1/errorLogs**

Retrieves paginated error logs. Requires JWT authentication via HTTP-only cookie.

**Cookie:** `jwt_token=<jwt>` (sent automatically by browser)

**Query Parameters:**
- `page` (optional) — Page number (default: 1). Each page returns up to 100 logs.
- `search` (optional) — Case-insensitive text search across the `message`, `route`, and `stack_trace` fields.

**Examples:**
- `/v1/errorLogs?page=2`
- `/v1/errorLogs?search=timeout`

**Response (200):**
```json
{
  "data": [
    {
      "id": 5,
      "message": "Database connection failed",
      "stack_trace": "Error: connect ECONNREFUSED ...",
      "route": "/v1/errorLogs",
      "environment": "production",
      "created_at": "2026-04-14T12:37:03.966Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 100,
    "totalPages": 1,
    "totalCount": 5
  }
}
```

### (GET) **/v1/errorLogs/meta**

Returns the available error log fields that can be queried through the meta endpoint family. Requires JWT authentication via HTTP-only cookie.

**Cookie:** `jwt_token=<jwt>` (sent automatically by browser)

**Response (200):**
```json
{
  "data": {
    "resource": "ErrorLog",
    "values": [
      "id",
      "message",
      "stack_trace",
      "route",
      "environment",
      "created_at"
    ],
    "count": 6
  }
}
```

### (GET) **/v1/errorLogs/meta/:field**

Returns the distinct values for a single error log field. Requires JWT authentication via HTTP-only cookie.

Max 1000 values will be returned, limited tells if amount of data was limited

**Cookie:** `jwt_token=<jwt>` (sent automatically by browser)

**Route Parameters:**
- `field` — A valid error log field name returned by `/v1/errorLogs/meta`.

**Example:**
- `/v1/errorLogs/meta/route`

**Response (200):**
```json
{
  "data": {
    "field": "route",
    "values": ["/v1/requestLogs", "/v1/errorLogs"],
    "count": 2,
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
