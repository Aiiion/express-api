import openWeatherMapsService from "../../services/openWeatherMaps.service.mjs";
import weatherAggregatorService from "../../services/weatherAggregator.service.mjs";
import { getCoordinateBound } from "../../utils/geoHelpers.mjs";
import { devError } from "../../utils/logger.mjs";

export const index = async (req, res) => {
  const { lat, lon, days } = req.query;
  const metric = req.query.units !== "imperial"; // default to metric unless imperial is specified
  const parsedDays = Number.parseInt(days, 10);
  let forecastDays = Number.isNaN(parsedDays) ? 5 : parsedDays;
  if(forecastDays > 6) forecastDays = 6;
  

  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);
  const bound = getCoordinateBound(parsedLat, parsedLon);
  const provider = bound?.provider;

  const getWarnings = async () => {
    if (!provider) {
      return null;
    }
    try {
      const warningsData = await provider.service.weatherWarnings(parsedLat, parsedLon);
      return provider.dto.weatherWarnings(warningsData);
    } catch (err) {
      devError('Failed to fetch weather warnings:', err.message);
      return null;
    }
  };

  // Use weatherAggregator service to get data from both openWeatherMaps and weatherApi
  // Get pollution from openWeatherMaps (no aggregation available)
  // Get weather warnings from local provider based on coordinates
  const [currentWeather, forecastWeather, pollution, warnings] = await Promise.all([
    weatherAggregatorService.currentWeather(parsedLat, parsedLon, metric),
    weatherAggregatorService.forecastWeather(parsedLat, parsedLon, metric, forecastDays),
    openWeatherMapsService.currentPollution({ lat: parsedLat, lon: parsedLon }),
    getWarnings(),
  ]);

  return res.status(200).send({
    data: {
      currentWeather,
      forecastWeather,
      currentPollution: pollution,
      weatherWarnings: warnings,
    },
  });
};
