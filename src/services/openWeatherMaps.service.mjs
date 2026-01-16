import axios from "axios";
import { OWM_API_URL } from "../utils/constants.mjs";

const openWeatherMapsService = {
    currentWeather: async (query) =>
        axios({
            method: 'get',
            url: OWM_API_URL + '/weather',
            params: {
                ...query,
                appid: process.env.OWM_API_KEY,
            },
        }),

    forecastWeather: async (query) =>
        axios({
            method: 'get',
            url: OWM_API_URL + '/forecast',
            params: {
                ...query,
                appid: process.env.OWM_API_KEY,
            },
        }),

    currentPollution: async (query) =>
        axios({
            method: 'get',
            url: OWM_API_URL + '/air_pollution',
            params: {
                ...query,
                appid: process.env.OWM_API_KEY,
            },
        }),

    forecastPollution: async (query) =>
        axios({
            method: 'get',
            url: OWM_API_URL + '/air_pollution/forecast',
            params: {
                ...query,
                appid: process.env.OWM_API_KEY,
            },
        }),
};

export default openWeatherMapsService;