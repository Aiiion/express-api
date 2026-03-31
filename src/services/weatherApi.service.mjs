import axios from "axios";
import { WEATHERAPI_API_URL } from "../utils/constants.mjs";

const weatherApiService = {
    ipLocation: async (ip) => {
        const response = await axios({
            method: 'get',
            url: WEATHERAPI_API_URL + `/ip.json`,
            params: {
                key: process.env.WEATHERAPI_API_KEY,
                q: ip,
            },
            timeout: 2000,
        });
        return response.data;
    },
    weatherWarnings: async (lat, lon) => {
        const response = await axios({
            method: 'get',
            url: WEATHERAPI_API_URL + `/alerts.json`,
            params: {
                key: process.env.WEATHERAPI_API_KEY,
                q: `${lat},${lon}`,
            },
            timeout: 2000,
        });
        return response.data;
    },
    currentWeather: async (lat, lon) => {
        const response = await axios({
            method: 'get',
            url: WEATHERAPI_API_URL + `/current.json`,
            params: {
                key: process.env.WEATHERAPI_API_KEY,
                q: `${lat},${lon}`,
            },
            timeout: 2000,
        });
        return response.data;
    },
    forecastWeather: async (lat, lon, days = 3) => {
        const response = await axios({
            method: 'get',
            url: WEATHERAPI_API_URL + `/forecast.json`,
            params: {
                key: process.env.WEATHERAPI_API_KEY,
                q: `${lat},${lon}`,
                days: days,
            },
            timeout: 2000,
        });
        return response.data;
    },
};

export default weatherApiService;