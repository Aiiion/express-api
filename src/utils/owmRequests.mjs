import axios from "axios";
import { EXTERNAL_WEATHER_URL } from "../utils/constants.mjs";

export const currentWeather = async (query) => 
    axios({
        method: 'get',
        url: EXTERNAL_WEATHER_URL + '/weather',
        params: {
            ...query,
            appid: process.env.WEATHER_API_KEY
        }
    });

export const forecastWeather = async (query) =>
    axios({
        method: 'get',
        url: EXTERNAL_WEATHER_URL + '/forecast',
        params: {
            ...query,
            appid: process.env.WEATHER_API_KEY
        }
    });

export const currentPollution = async (query) =>
    axios({
        method: 'get',
        url: EXTERNAL_WEATHER_URL + '/air_pollution',
        params: {
            ...query,
            appid: process.env.WEATHER_API_KEY
        }
    });

export const forecastPollution = async (query) =>
    axios({
        method: 'get',
        url: EXTERNAL_WEATHER_URL + '/air_pollution/forecast',
        params: {
            ...query,
            appid: process.env.WEATHER_API_KEY
        }
    });