import { EMAIL, GITHUB } from "../utils/constants.mjs";
import { currentPollution, currentWeather, forecastPollution, forecastWeather } from "../utils/owmRequests.mjs";

export const test = (req, res) => res.status(200).send({message: 'API is running'});

export const contact = (req, res) => res.status(200).send({
    message: "Hello! I am Alex. Feel free to use this API. If you have any questions or feedback, please reach out to me via email or GitHub.",
    github: GITHUB,
    email: EMAIL
});

export const weather = async (req, res) => {
    const appid = process.env.WEATHER_API_KEY;

    if(!appid)
        return res.status(500).send({message: "API key missing from environment variables"});

    const weatherReq = await currentWeather(req.query, appid);
    const forecastReq = await forecastWeather(req.query, appid);

    return res.status(200).send({data: {
        current: weatherReq.data,
        forecast: forecastReq.data
    }});
}

export const pollution = async (req, res) => {
    const appid = process.env.WEATHER_API_KEY;

    if(!appid)
        return res.status(500).send({message: "API key missing from environment variables"});

    const pollutionReq = await currentPollution(req.query, appid);
    const forecastReq = await forecastPollution(req.query, appid);

    return res.status(200).send({data: {
        current: pollutionReq.data,
        forecast: forecastReq.data
    }});
}