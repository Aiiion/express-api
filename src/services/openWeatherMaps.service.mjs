import axios from "axios";
import { OWM_API_URL } from "../utils/constants.mjs";

const openWeatherMapsService = {
    currentWeather: async (query) => {
        const res = await axios({
            method: "get",
            url: OWM_API_URL + "/weather",
            params: {
                ...query,
                appid: process.env.OWM_API_KEY,
            },
        });
        return res.data;
    },

    forecastWeather: async (query) => {
        const res = await axios({
            method: "get",
            url: OWM_API_URL + "/forecast",
            params: {
                ...query,
                appid: process.env.OWM_API_KEY,
            },
        });
        return res.data;
    },

    currentPollution: async (query) => {
        const res = await axios({
            method: "get",
            url: OWM_API_URL + "/air_pollution",
            params: {
                ...query,
                appid: process.env.OWM_API_KEY,
            },
        });
        return res.data;
    },

    forecastPollution: async (query) => {
        const res = await axios({
            method: "get",
            url: OWM_API_URL + "/air_pollution/forecast",
            params: {
                ...query,
                appid: process.env.OWM_API_KEY,
            },
        });
        return res.data;
    },
};

export default openWeatherMapsService;