import { YR_API_URL, YR_ALERTS_API_URL } from "../utils/constants.mjs";
import { withCache } from "./redis.service.mjs";
import userAgent from "../utils/userAgent.mjs";

const YR_CACHE_TTL = 600; // 10 minutes

const yrFetch = async (baseUrl, path, query) => {
    const params = new URLSearchParams(query);
    const response = await fetch(`${baseUrl}${path}?${params}`, {
        signal: AbortSignal.timeout(2000),
        ...userAgent,
    });
    if (!response.ok) throw new Error(`Yr error: ${response.status} ${response.statusText}`);
    return response.json();
};

// Yr compact endpoint serves both current and forecast data in a single response
const yrService = {
    forecastWeather: (lat, lon) =>
        withCache(
            `yr:forecast:${lat}:${lon}`,
            YR_CACHE_TTL,
            () => yrFetch(YR_API_URL, '/compact', { lat, lon }),
        ),

    weatherWarnings: (lat, lon) =>
        yrFetch(YR_ALERTS_API_URL, '/current.json', { lat, lon, lang: 'en' }),
};

export default yrService;
