import { OWM_API_URL } from "../utils/constants.mjs";

const openWeatherMapsService = {
    currentWeather: async (query) => {
        const params = new URLSearchParams({
            ...query,
            appid: process.env.OWM_API_KEY,
        });
        const res = await fetch(`${OWM_API_URL}/weather?${params}`);
        if (!res.ok) throw new Error(`OpenWeatherMap error: ${res.status} ${res.statusText}`);
        return res.json();
    },

    forecastWeather: async (query) => {
        const params = new URLSearchParams({
            ...query,
            appid: process.env.OWM_API_KEY,
        });
        const res = await fetch(`${OWM_API_URL}/forecast?${params}`);
        if (!res.ok) throw new Error(`OpenWeatherMap error: ${res.status} ${res.statusText}`);
        return res.json();
    },

    currentPollution: async (query) => {
        const params = new URLSearchParams({
            ...query,
            appid: process.env.OWM_API_KEY,
        });
        const res = await fetch(`${OWM_API_URL}/air_pollution?${params}`);
        if (!res.ok) throw new Error(`OpenWeatherMap error: ${res.status} ${res.statusText}`);
        return res.json();
    },

    forecastPollution: async (query) => {
        const params = new URLSearchParams({
            ...query,
            appid: process.env.OWM_API_KEY,
        });
        const res = await fetch(`${OWM_API_URL}/air_pollution/forecast?${params}`);
        if (!res.ok) throw new Error(`OpenWeatherMap error: ${res.status} ${res.statusText}`);
        return res.json();
    },
};

export default openWeatherMapsService;