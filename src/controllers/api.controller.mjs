import axios from "axios";
import { EXTERNAL_WEATHER_URL } from "../utils/constants.mjs";
export const test = (req, res) => res.status(200).send({message: 'test successful'});

export const weather = async (req, res) => {
    if(!req.query.lat || !req.query.lon)
        return res.status(400).send({message: "You need to provide both lat and lon coordinates"});

    const weatherReq = await axios({
        method: 'get',
        url: EXTERNAL_WEATHER_URL + '/weather',
        params: {
            ...req.query,
            appid: process.env.WEATHER_API_KEY
        }
    });

    const forecastReq = await axios({
        method: 'get',
        url: EXTERNAL_WEATHER_URL + '/forecast',
        params: {
            ...req.query,
            appid: process.env.WEATHER_API_KEY
        }
    });

    return res.status(200).send({data: {
        current: weatherReq.data,
        forecast: forecastReq.data
    }});
}