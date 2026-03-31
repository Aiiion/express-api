import openWeatherMapsService from "../../services/openWeatherMaps.service.mjs";
import weatherAggregatorService from "../../services/weatherAggregator.service.mjs";
import { getCoordinateBound } from "../../utils/geoHelpers.mjs";

export const index = async (req, res) => {
  const { lat, lon, days } = req.query;
  const metric = req.query.units !== "imperial"; // default to metric unless imperial is specified
  const parsedDays = Number.parseInt(days, 10);
  const forecastDays = Number.isNaN(parsedDays) ? 3 : parsedDays;

  // Use weatherAggregator service to get data from both openWeatherMaps and weatherApi
  const currentWeather = await weatherAggregatorService.currentWeather(
    parseFloat(lat),
    parseFloat(lon),
    metric
  );

  const forecastWeather = await weatherAggregatorService.forecastWeather(
    parseFloat(lat),
    parseFloat(lon),
    metric,
    forecastDays
  );

  // Get pollution from openWeatherMaps (no aggregation available)
  const pollution = await openWeatherMapsService.currentPollution(req.query);

  // Get weather warnings from local provider based on coordinates
  let warnings = null;
  const bound = getCoordinateBound(parseFloat(lat), parseFloat(lon));
  const provider = bound?.provider;
  try {
    warnings = await provider.service.weatherWarnings(parseFloat(lat), parseFloat(lon)).then((warningsData) => {
      return provider.dto.weatherWarnings(warningsData);
    });
  } catch (err) {
    console.error('Failed to fetch weather warnings:', err.message);
    warnings = null;
  }

  return res.status(200).send({
    data: {
      currentWeather,
      forecastWeather,
      currentPollution: pollution,
      weatherWarnings: warnings,
    },
  });
};
