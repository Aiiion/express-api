import openWeatherMapsService from "../../services/providers/openWeatherMaps.service.mjs";
import weatherAggregatorService from "../../services/weatherAggregator.service.mjs";
import { getCoordinateBound } from "../../utils/geoHelpers.mjs";
import { devError } from "../../utils/logger.mjs";

export const index = async (req, res) => {
  const { lat, lon, days, units: metric } = req.query;
  const bound = getCoordinateBound(lat, lon);
  const provider = bound?.provider;

  const getWarnings = async () => {
    if (!provider) {
      return null;
    }
    try {
      const warningsData = await provider.service.weatherWarnings(lat, lon);
      return provider.dto.weatherWarnings(warningsData);
    } catch (err) {
      devError('Failed to fetch weather warnings:', err.message);
      return null;
    }
  };

  // Use weatherAggregator service to fetch all provider data in a single pass.
  // Get pollution from openWeatherMaps (no aggregation available)
  // Get weather warnings from local provider based on coordinates
  const [{ currentWeather, forecastWeather }, pollution, warnings] = await Promise.all([
    weatherAggregatorService.allWeather(lat, lon, metric, days),
    openWeatherMapsService.currentPollution({ lat, lon }),
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
