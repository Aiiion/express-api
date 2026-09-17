import { SMHI_WPT_API_URL, SMHI_FORECAST_API_URL } from "../../utils/constants.mjs";
import { withCache } from "../infrastructure/redis.service.mjs";
import { providerFetch } from "../../utils/providerFetch.mjs";

const SMHI_CACHE_TTL = 600; // 10 minutes

const smhiService = {
    forecastWeather: (lat, lon) =>
        withCache(
            `smhi:forecast:${lat}:${lon}`,
            SMHI_CACHE_TTL,
            () => providerFetch('SMHI', `${SMHI_FORECAST_API_URL}/geotype/point/lon/${lon}/lat/${lat}/data.json`),
        ),

    weatherWarnings: (lat, lon) =>
        withCache(
            `smhi:warnings:${lat}:${lon}`,
            SMHI_CACHE_TTL,
            () => providerFetch('SMHI', `${SMHI_WPT_API_URL}/warnings/most-severe/lat/${lat}/lon/${lon}`),
        ),
};

export default smhiService;
