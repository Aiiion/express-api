import { OWM_API_URL } from "../utils/constants.mjs";
import { getJsonValue, setJsonValue } from "./redis.service.mjs";

const OWM_CACHE_TTL = 600; // 10 minutes

const openWeatherMapsService = {
    currentWeather: async (query) => {
        const cacheKey = `owm:current:${query.lat}:${query.lon}:${query.units ?? "metric"}`;
        const cached = await getJsonValue(cacheKey);
        if (cached) return cached;

        const params = new URLSearchParams({ ...query, appid: process.env.OWM_API_KEY });
        const res = await fetch(`${OWM_API_URL}/weather?${params}`);
        if (!res.ok) throw new Error(`OpenWeatherMap error: ${res.status} ${res.statusText}`);
        const data = await res.json();
        await setJsonValue(cacheKey, data, OWM_CACHE_TTL);
        return data;
    },

    forecastWeather: async (query) => {
        const cacheKey = `owm:forecast:${query.lat}:${query.lon}:${query.units ?? "metric"}`;
        const cached = await getJsonValue(cacheKey);
        if (cached) return cached;

        const params = new URLSearchParams({ ...query, appid: process.env.OWM_API_KEY });
        const res = await fetch(`${OWM_API_URL}/forecast?${params}`);
        if (!res.ok) throw new Error(`OpenWeatherMap error: ${res.status} ${res.statusText}`);
        const data = await res.json();
        await setJsonValue(cacheKey, data, OWM_CACHE_TTL);
        return data;
    },

    currentPollution: async (query) => {
        const cacheKey = `owm:pollution:current:${query.lat}:${query.lon}`;
        const cached = await getJsonValue(cacheKey);
        if (cached) return cached;

        const params = new URLSearchParams({ ...query, appid: process.env.OWM_API_KEY });
        const res = await fetch(`${OWM_API_URL}/air_pollution?${params}`);
        if (!res.ok) throw new Error(`OpenWeatherMap error: ${res.status} ${res.statusText}`);
        const data = await res.json();
        await setJsonValue(cacheKey, data, OWM_CACHE_TTL);
        return data;
    },

    forecastPollution: async (query) => {
        const cacheKey = `owm:pollution:forecast:${query.lat}:${query.lon}`;
        const cached = await getJsonValue(cacheKey);
        if (cached) return cached;

        const params = new URLSearchParams({ ...query, appid: process.env.OWM_API_KEY });
        const res = await fetch(`${OWM_API_URL}/air_pollution/forecast?${params}`);
        if (!res.ok) throw new Error(`OpenWeatherMap error: ${res.status} ${res.statusText}`);
        const data = await res.json();
        await setJsonValue(cacheKey, data, OWM_CACHE_TTL);
        return data;
    },
};

export default openWeatherMapsService;