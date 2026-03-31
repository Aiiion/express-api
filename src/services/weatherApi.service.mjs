import { WEATHERAPI_API_URL } from "../utils/constants.mjs";

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
        const params = new URLSearchParams({
            key: process.env.WEATHERAPI_API_KEY,
            q: `${lat},${lon}`,
        });
        const response = await fetch(`${WEATHERAPI_API_URL}/alerts.json?${params}`, {
            signal: AbortSignal.timeout(2000),
        });
        if (!response.ok) throw new Error(`WeatherAPI error: ${response.status} ${response.statusText}`);
        return response.json();
    },
    currentWeather: async (lat, lon) => {
        const params = new URLSearchParams({
            key: process.env.WEATHERAPI_API_KEY,
            q: `${lat},${lon}`,
        });
        const response = await fetch(`${WEATHERAPI_API_URL}/current.json?${params}`, {
            signal: AbortSignal.timeout(2000),
        });
        if (!response.ok) throw new Error(`WeatherAPI error: ${response.status} ${response.statusText}`);
        return response.json();
    },
    forecastWeather: async (lat, lon, days = 3) => {
        const params = new URLSearchParams({
            key: process.env.WEATHERAPI_API_KEY,
            q: `${lat},${lon}`,
            days: days,
        });
        const response = await fetch(`${WEATHERAPI_API_URL}/forecast.json?${params}`, {
            signal: AbortSignal.timeout(2000),
        });
        if (!response.ok) throw new Error(`WeatherAPI error: ${response.status} ${response.statusText}`);
        return response.json();
    },
};

export default weatherApiService;