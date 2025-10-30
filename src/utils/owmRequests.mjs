import axios from "axios";
import { EXTERNAL_WEATHER_URL } from "../utils/constants.mjs";

export const currentWeather = async (query, appid) => 
    axios({
        method: 'get',
        url: EXTERNAL_WEATHER_URL + '/weather',
        params: {
            ...query,
            appid
        }
    });

export const forecastWeather = async (query, appid) =>
    axios({
        method: 'get',
        url: EXTERNAL_WEATHER_URL + '/forecast',
        params: {
            ...query,
            appid
        }
    });

export const currentPollution = async (query, appid) =>
    axios({
        method: 'get',
        url: EXTERNAL_WEATHER_URL + '/air_pollution',
        params: {
            ...query,
            appid
        }
    });

export const forecastPollution = async (query, appid) =>
    axios({
        method: 'get',
        url: EXTERNAL_WEATHER_URL + '/air_pollution/forecast',
        params: {
            ...query,
            appid
        }
    });