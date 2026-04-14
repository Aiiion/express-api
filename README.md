# Data sources:

Thanks to:

openweathermaps.org

smhi.se

weatherapi.com

# Usage

*If you wish to host this API for yourself you will need API keys for certain services, see .env.example.*

**Required environment variables:**

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) used to send verification emails |
| `EMAIL_SENDER` | The "from" address used when sending emails (must be a verified sender in Resend) |
| `ADMIN_EMAIL` | The email address that login verification codes are sent to |
| `ADMIN_PASSWORD` | The password required to initiate the login flow |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens |

**Start this app up using docker:**

```
docker compose build
docker compose up
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

### (GET) **/weather/aggregate** (Beta)

Combines these three requests plus local weather warnings (warnings are currently only supported in Sweden). You can use the same query as described in the docs (but without appid)

https://openweathermap.org/current

https://openweathermap.org/forecast5 (weather data sorted in to days)

https://openweathermap.org/api/air-pollution (only current)

### (GET) **/v1/weather**

Aggregates current weather, forecast, pollution, and local weather warnings from multiple sources (openweathermap.org, weatherapi.com, smhi.se). Supports the same `lat`/`lon` query parameters, plus `days` (1–6, default 5) and `units` (`imperial` or `metric`, defaults to `metric`).

---

## Authentication

The API uses a two-step email-based authentication flow that issues a short-lived JWT.

**Flow:**

1. `POST /v1/auth/login` — Submit the admin password. On success, a 6-digit verification code is emailed to `ADMIN_EMAIL` and a `sessionToken` is returned.
2. `POST /v1/auth/verify` — Submit the `sessionToken` and the `code` received by email. On success, a signed JWT is returned (valid for 3 hours).
3. `GET /v1/auth/verify-token` — Check whether a JWT is still valid by passing it as a `Bearer` token in the `Authorization` header.

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

Verifies the emailed code and returns a JWT.

**Body:**
```json
{ "sessionToken": "<token>", "code": "123456" }
```

**Response (200):**
```json
{
  "message": "Authentication successful",
  "token": "<jwt>",
  "expiresIn": "3h"
}
```

### (GET) **/v1/auth/verify-token**

Checks whether a JWT is still valid.

**Header:** `Authorization: Bearer <jwt>`

**Response (200):**
```json
{ "message": "Token is valid" }
```
