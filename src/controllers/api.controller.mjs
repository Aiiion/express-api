import axios from "axios";
import { EXTERNAL_WEATHER_URL, EMAIL, GITHUB } from "../utils/constants.mjs";

export const test = (req, res) => res.status(200).send({message: 'API is running'});

export const contact = (req, res) => res.status(200).send({
    message: "Hello! I am Alex. Feel free to use this API. If you have any questions or feedback, please reach out to me via email or GitHub.",
    github: GITHUB,
    email: EMAIL
});

export const weather = async (req, res) => {
    if(!req.query.lat || !req.query.lon)
        return res.status(400).send({message: "You need to provide both lat and lon coordinates"});

    const appid = process.env.WEATHER_API_KEY;

    if(!appid)
        return res.status(500).send({message: "API key missing from environment variables"});

    const weatherReq = await axios({
        method: 'get',
        url: EXTERNAL_WEATHER_URL + '/weather',
        params: {
            ...req.query,
            appid
        }
    });

    const forecastReq = await axios({
        method: 'get',
        url: EXTERNAL_WEATHER_URL + '/forecast',
        params: {
            ...req.query,
            appid
        }
    });

    return res.status(200).send({data: {
        current: weatherReq.data,
        forecast: forecastReq.data
    }});
}

export const pollution = async (req, res) => {
    if(!req.query.lat || !req.query.lon)
        return res.status(400).send({message: "You need to provide both lat and lon coordinates"});

    const appid = process.env.WEATHER_API_KEY;

    if(!appid)
        return res.status(500).send({message: "API key missing from environment variables"});

    const pollutionReq = await axios({
        method: 'get',
        url: EXTERNAL_WEATHER_URL + '/pollution',
        params: {
            ...req.query,
            appid
        }
    });

    const forecastReq = await axios({
        method: 'get',
        url: EXTERNAL_WEATHER_URL + '/pollution/forecast',
        params: {
            ...req.query,
            appid
        }
    });

    return res.status(200).send({data: {
        current: pollutionReq.data,
        forecast: forecastReq.data
    }});
}