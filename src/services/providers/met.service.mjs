import { MET_API_URL, MET_ALERTS_API_URL } from "../../utils/constants.mjs";
import { withCache } from "../infrastructure/redis.service.mjs";
import { providerFetch } from "../../utils/providerFetch.mjs";

const MET_CACHE_TTL = 600; // 10 minutes

const metFetch = (baseUrl, path, query) => {
    const params = new URLSearchParams(query);
    return providerFetch('Met', `${baseUrl}${path}?${params}`);
};

// Met compact endpoint serves both current and forecast data in a single response
const metService = {
    forecastWeather: (lat, lon) =>
        withCache(
            `met:forecast:${lat}:${lon}`,
            MET_CACHE_TTL,
            () => metFetch(MET_API_URL, '/compact', { lat, lon }),
        ),

    weatherWarnings: (lat, lon) =>
        withCache(
            `met:warnings:${lat}:${lon}`,
            MET_CACHE_TTL,
            () => metFetch(MET_ALERTS_API_URL, '/current.json', { lat, lon, lang: 'en' }),
        ),
};

export default metService;
