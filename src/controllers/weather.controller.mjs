import openWeatherMapsService from "../services/openWeatherMaps.service.mjs";
import { getCoordinateBound } from "../utils/geoHelpers.mjs";
import { translateEpochDay } from "../utils/dateTimeHelpers.mjs";

export const aggregate = async (req, res) => {
  const weather = await openWeatherMapsService.currentWeather(req.query);
  const pollution = await openWeatherMapsService.currentPollution(req.query);
  
  let warnings = null;
  const bound = getCoordinateBound(req.query.lat, req.query.lon);
  if (bound?.provider) {
    try {
      warnings = await bound.provider.weatherWarnings(req.query.lat, req.query.lon);
    } catch (err) {
      console.error('Failed to fetch weather warnings:', err.message);
      warnings = null;
    }
  }

  const forecast = await openWeatherMapsService.forecastWeather(req.query).then((forecastData) => {
    const upcoming = {};

    for (let i = 0; i < forecastData.list.length; i++) {
      const day = translateEpochDay(forecastData.list[i].dt);
      if (!upcoming[day]) {
        upcoming[day] = [];
      }
      upcoming[day].push(forecastData.list[i]);
    }
    return upcoming;
  });

  return res.status(200).send({
    data: {
      currentWeather: weather,
      forecastWeather: forecast,
      currentPollution: pollution,
      weatherWarnings: warnings,
    },
  });
};

export const weather = async (req, res) => {
  const weather = await openWeatherMapsService.currentWeather(req.query);
  const forecast = await openWeatherMapsService.forecastWeather(req.query);

  return res.status(200).send({
    data: {
      current: weather,
      forecast: forecast,
    },
  });
};

export const pollution = async (req, res) => {
  const pollution = await openWeatherMapsService.currentPollution(req.query);
  const forecast = await openWeatherMapsService.forecastPollution(req.query);

  return res.status(200).send({
    data: {
      current: pollution,
      forecast: forecast,
    },
  });
};
