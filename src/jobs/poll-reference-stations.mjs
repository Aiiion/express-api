import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { sequelize } from '../models/index.mjs';
import initProviderForecastSnapshot from '../models/providerForecastSnapshot.model.mjs';
import weatherAggregatorService from '../services/weatherAggregator.service.mjs';
import referenceStations from '../data/referenceStations.mjs';
import { devError } from '../utils/logger.mjs';

dotenv.config();

/**
 * Calls allWeather() for each reference station coordinate.
 * The captureForecasts() call inside allWeather() handles snapshot insertion.
 * Runs sequentially to avoid thundering against external provider APIs.
 */
export const pollReferenceStations = async () => {
  let succeeded = 0;
  let failed = 0;

  for (const station of referenceStations) {
    try {
      await weatherAggregatorService.allWeather(station.lat, station.lon);
      succeeded++;
    } catch (err) {
      devError(`pollReferenceStations: failed for ${station.name}:`, err?.message);
      failed++;
    }
  }

  return { succeeded, failed, total: referenceStations.length };
};

// Run standalone when executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    try {
      await sequelize.authenticate();
      initProviderForecastSnapshot(sequelize);
      const result = await pollReferenceStations();
      console.log('Done:', result);
      process.exit(0);
    } catch (err) {
      devError('poll-reference-stations failed:', err);
      process.exit(1);
    }
  })();
}
