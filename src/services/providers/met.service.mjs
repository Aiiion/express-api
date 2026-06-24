import { MET_API_URL, MET_ALERTS_API_URL } from "../../utils/constants.mjs";
import { withCache } from "../infrastructure/redis.service.mjs";
import userAgent from "../../utils/userAgent.mjs";

const MET_CACHE_TTL = 600; // 10 minutes

const metFetch = async (baseUrl, path, query) => {
    const params = new URLSearchParams(query);
    const response = await fetch(`${baseUrl}${path}?${params}`, {
        signal: AbortSignal.timeout(2000),
        ...userAgent,
    });
    if (!response.ok) throw new Error(`Met error: ${response.status} ${response.statusText}`);
    return response.json();
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
        metFetch(MET_ALERTS_API_URL, '/current.json', { lat, lon, lang: 'en' }),
};

export default metService;
