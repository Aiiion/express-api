import openWeatherMapsService from "../services/openWeatherMaps.service.mjs";

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
