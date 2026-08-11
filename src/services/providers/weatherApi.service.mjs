import { WEATHERAPI_API_URL } from "../../utils/constants.mjs";
import { withCache } from "../infrastructure/redis.service.mjs";
import { providerFetch } from "../../utils/providerFetch.mjs";

const WEATHERAPI_CACHE_TTL = 600; // 10 minutes

const waFetch = (path, params) => providerFetch('WeatherAPI', `${WEATHERAPI_API_URL}${path}?${params}`);

const weatherApiService = {
    ipLocation: (ip) => {
        const params = new URLSearchParams({ key: process.env.WEATHERAPI_API_KEY, q: ip });
        return waFetch('/ip.json', params);
    },

    weatherWarnings: (lat, lon) =>
        withCache(
            `weatherapi:warnings:${lat}:${lon}`,
            WEATHERAPI_CACHE_TTL,
            () => waFetch('/alerts.json', new URLSearchParams({ key: process.env.WEATHERAPI_API_KEY, q: `${lat},${lon}` })),
        ),

    currentWeather: (lat, lon) =>
        withCache(
            `weatherapi:current:${lat}:${lon}`,
            WEATHERAPI_CACHE_TTL,
            () => waFetch('/current.json', new URLSearchParams({ key: process.env.WEATHERAPI_API_KEY, q: `${lat},${lon}` })),
        ),

    forecastWeather: (lat, lon, days = 3) =>
        withCache(
            `weatherapi:forecast:${lat}:${lon}:${days}`,
            WEATHERAPI_CACHE_TTL,
            () => waFetch('/forecast.json', new URLSearchParams({ key: process.env.WEATHERAPI_API_KEY, q: `${lat},${lon}`, days })),
        ),
};

export default weatherApiService;
