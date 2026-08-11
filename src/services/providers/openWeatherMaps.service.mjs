import { OWM_API_URL } from "../../utils/constants.mjs";
import { withCache } from "../infrastructure/redis.service.mjs";
import { providerFetch } from "../../utils/providerFetch.mjs";

const OWM_CACHE_TTL = 600; // 10 minutes

const owmFetch = (path, query) => {
    const params = new URLSearchParams({ ...query, appid: process.env.OWM_API_KEY });
    return providerFetch('OpenWeatherMap', `${OWM_API_URL}${path}?${params}`);
};

const openWeatherMapsService = {
    currentWeather: (query) =>
        withCache(
            `owm:current:${query.lat}:${query.lon}:${query.units ?? "metric"}`,
            OWM_CACHE_TTL,
            () => owmFetch('/weather', query),
        ),

    forecastWeather: (query) =>
        withCache(
            `owm:forecast:${query.lat}:${query.lon}:${query.units ?? "metric"}`,
            OWM_CACHE_TTL,
            () => owmFetch('/forecast', query),
        ),

    currentPollution: (query) =>
        withCache(
            `owm:pollution:current:${query.lat}:${query.lon}`,
            OWM_CACHE_TTL,
            () => owmFetch('/air_pollution', query),
        ),

    forecastPollution: (query) =>
        withCache(
            `owm:pollution:forecast:${query.lat}:${query.lon}`,
            OWM_CACHE_TTL,
            () => owmFetch('/air_pollution/forecast', query),
        ),
};

export default openWeatherMapsService;
