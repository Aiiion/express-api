import {
  currentPollution,
  currentWeather,
  forecastPollution,
  forecastWeather,
} from "../utils/owmRequests.mjs";
import { translateEpochDay } from "../utils/dateTimeHelpers.mjs";

export const aggregate = async (req, res) => {
  const appid = process.env.WEATHER_API_KEY;

  if (!appid)
    return res
      .status(500)
      .send({ message: "API key missing from environment variables" });

  const weatherReq = await currentWeather(req.query, appid);
  const pollutionReq = await currentPollution(req.query, appid);
  
  const forecastReq = await forecastWeather(req.query, appid).then((res) => {
    const forcastData = res.data;
    const upcoming = {};

    for (let i = 0; i < forcastData.list.length; i++) {
      const day = translateEpochDay(forcastData.list[i].dt);
      if (!upcoming[day]) {
        upcoming[day] = [];
      }
      upcoming[day].push(forcastData.list[i]);
    }
    return upcoming;
  });

  return res.status(200).send({
    data: {
      currentWeather: weatherReq.data,
      forecastWeather: forecastReq,
      currentPollution: pollutionReq.data,
    },
  });
};

export const weather = async (req, res) => {
  const appid = process.env.WEATHER_API_KEY;

  if (!appid)
    return res
      .status(500)
      .send({ message: "API key missing from environment variables" });

  const weatherReq = await currentWeather(req.query, appid);
  const forecastReq = await forecastWeather(req.query, appid);

  return res.status(200).send({
    data: {
      current: weatherReq.data,
      forecast: forecastReq.data,
    },
  });
};

export const pollution = async (req, res) => {
  const appid = process.env.WEATHER_API_KEY;

  if (!appid)
    return res
      .status(500)
      .send({ message: "API key missing from environment variables" });

  const pollutionReq = await currentPollution(req.query, appid);
  const forecastReq = await forecastPollution(req.query, appid);

  return res.status(200).send({
    data: {
      current: pollutionReq.data,
      forecast: forecastReq.data,
    },
  });
};
