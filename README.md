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
