import { SMHI_WPT_API_URL, SMHI_FORECAST_API_URL } from "../utils/constants.mjs";
import { getJsonValue, setJsonValue } from "./redis.service.mjs";

const SMHI_FORECAST_CACHE_TTL = 600; // 10 minutes

const smhiService = {
    forecastWeather: async (lat, lon) => {
        const cacheKey = `smhi:forecast:${lat}:${lon}`;
        const cached = await getJsonValue(cacheKey);
        if (cached) return cached;

        const response = await fetch(
            `${SMHI_FORECAST_API_URL}/geotype/point/lon/${lon}/lat/${lat}/data.json`,
            { signal: AbortSignal.timeout(2000) }
        );
        if (!response.ok) throw new Error(`SMHI error: ${response.status} ${response.statusText}`);
        const data = await response.json();
        await setJsonValue(cacheKey, data, SMHI_FORECAST_CACHE_TTL);
        return data;
    },
    weatherWarnings: async (lat, lon) => {
        const response = await fetch(`${SMHI_WPT_API_URL}/warnings/most-severe/lat/${lat}/lon/${lon}`, {
            signal: AbortSignal.timeout(2000),
        });
        if (!response.ok) throw new Error(`SMHI error: ${response.status} ${response.statusText}`);
        return response.json();
    }
};

export default smhiService;