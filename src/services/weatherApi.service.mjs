import { WEATHERAPI_API_URL } from "../utils/constants.mjs";
import { getJsonValue, setJsonValue } from "./redis.service.mjs";

const WEATHERAPI_CACHE_TTL = 600; // 10 minutes

const weatherApiService = {
    ipLocation: async (ip) => {
        const params = new URLSearchParams({
            key: process.env.WEATHERAPI_API_KEY,
            q: ip,
        });
        const response = await fetch(`${WEATHERAPI_API_URL}/ip.json?${params}`, {
            signal: AbortSignal.timeout(2000),
        });
        if (!response.ok) throw new Error(`WeatherAPI error: ${response.status} ${response.statusText}`);
        return response.json();
    },
    weatherWarnings: async (lat, lon) => {
        const cacheKey = `weatherapi:warnings:${lat}:${lon}`;
        const cached = await getJsonValue(cacheKey);
        if (cached) return cached;

        const params = new URLSearchParams({
            key: process.env.WEATHERAPI_API_KEY,
            q: `${lat},${lon}`,
        });
        const response = await fetch(`${WEATHERAPI_API_URL}/alerts.json?${params}`, {
            signal: AbortSignal.timeout(2000),
        });
        if (!response.ok) throw new Error(`WeatherAPI error: ${response.status} ${response.statusText}`);
        const data = await response.json();
        await setJsonValue(cacheKey, data, WEATHERAPI_CACHE_TTL);
        return data;
    },
    currentWeather: async (lat, lon) => {
        const cacheKey = `weatherapi:current:${lat}:${lon}`;
        const cached = await getJsonValue(cacheKey);
        if (cached) return cached;

        const params = new URLSearchParams({
            key: process.env.WEATHERAPI_API_KEY,
            q: `${lat},${lon}`,
        });
        const response = await fetch(`${WEATHERAPI_API_URL}/current.json?${params}`, {
            signal: AbortSignal.timeout(2000),
        });
        if (!response.ok) throw new Error(`WeatherAPI error: ${response.status} ${response.statusText}`);
        const data = await response.json();
        await setJsonValue(cacheKey, data, WEATHERAPI_CACHE_TTL);
        return data;
    },
    forecastWeather: async (lat, lon, days = 3) => {
        const cacheKey = `weatherapi:forecast:${lat}:${lon}:${days}`;
        const cached = await getJsonValue(cacheKey);
        if (cached) return cached;

        const params = new URLSearchParams({
            key: process.env.WEATHERAPI_API_KEY,
            q: `${lat},${lon}`,
            days: days,
        });
        const response = await fetch(`${WEATHERAPI_API_URL}/forecast.json?${params}`, {
            signal: AbortSignal.timeout(2000),
        });
        if (!response.ok) throw new Error(`WeatherAPI error: ${response.status} ${response.statusText}`);
        const data = await response.json();
        await setJsonValue(cacheKey, data, WEATHERAPI_CACHE_TTL);
        return data;
    },
};

export default weatherApiService;