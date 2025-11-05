import {
  currentPollution,
  currentWeather,
  forecastPollution,
  forecastWeather,
} from "../services/openWeatherMaps.service.mjs";
import { translateEpochDay } from "../utils/dateTimeHelpers.mjs";

export const aggregate = async (req, res) => {
  const weatherReq = await currentWeather(req.query);
  const pollutionReq = await currentPollution(req.query);

  const forecastReq = await forecastWeather(req.query).then((res) => {
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
  const weatherReq = await currentWeather(req.query);
  const forecastReq = await forecastWeather(req.query);

  return res.status(200).send({
    data: {
      current: weatherReq.data,
      forecast: forecastReq.data,
    },
  });
};

export const pollution = async (req, res) => {
  const pollutionReq = await currentPollution(req.query);
  const forecastReq = await forecastPollution(req.query);

  return res.status(200).send({
    data: {
      current: pollutionReq.data,
      forecast: forecastReq.data,
    },
  });
};
