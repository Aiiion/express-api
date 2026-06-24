import openWeatherMapsDto from '../dtos/openWeatherMaps.dto.mjs';
import weatherApiDto from '../dtos/weatherApi.dto.mjs';
import smhiDto from '../dtos/smhi.dto.mjs';
import metDto from '../dtos/met.dto.mjs';
import { getCoordinateBound } from '../utils/geoHelpers.mjs';
import { sequelize } from '../models/index.mjs';
import { devError } from '../utils/logger.mjs';

const COUNTRY_CODE_MAP = {
  Sweden: 'SE',
  Norway: 'NO',
  Finland: 'FI',
  Global: 'GL',
};

// Round to 2 decimal places (~1 km grid) so that near-duplicate coordinates
// don't generate distinct rows and trip the unique constraint.
const roundCoord = (v) => Math.round(parseFloat(v) * 100) / 100;

const tomorrowUtc = () => {
  const d = new Date(Date.now() + 86400000);
  return d.toISOString().slice(0, 10);
};

const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

const dailyStatsFromHours = (hours) => {
  if (!hours?.length) return null;
  const temps = hours.map(h => h.temperature?.temp).filter(v => v != null);
  const winds = hours.map(h => h.wind?.speed).filter(v => v != null);
  const humidities = hours.map(h => h.humidity).filter(v => v != null);
  const pressures = hours.map(h => h.pressure).filter(v => v != null);
  // Sum precipitation amounts — each entry covers its own measurement window
  const total_precip = hours.reduce((sum, h) => sum + (h.precipitation?.amount ?? 0), 0);
  return {
    avg_temp: avg(temps),
    total_precip,
    avg_wind_speed: avg(winds),
    avg_humidity: avg(humidities),
    avg_pressure: avg(pressures),
  };
};

const extractProviderSnapshot = (settledResult, dtoFn, providerName, tomorrow) => {
  if (settledResult.status !== 'fulfilled') return null;
  try {
    const normalized = dtoFn(settledResult.value);
    if (!normalized?.list) return null;
    const hours = normalized.list[tomorrow];
    if (!hours?.length) return null;
    const stats = dailyStatsFromHours(hours);
    if (!stats) return null;
    // Plausible Celsius range on Earth: -90°C to 60°C. Values outside this
    // indicate wrong units (e.g. Kelvin from a missing units=metric parameter).
    if (stats.avg_temp != null && (stats.avg_temp < -90 || stats.avg_temp > 60)) {
      devError(`captureForecasts: ${providerName} returned implausible avg_temp ${stats.avg_temp} (wrong units?) — skipping snapshot`);
      return null;
    }
    return { provider: normalized.provider ?? providerName, ...stats };
  } catch {
    return null;
  }
};

/**
 * Fire-and-forget: captures each provider's next-day forecast as a DB snapshot.
 * Called from allWeather() after the provider fetches complete — never throws.
 *
 * @param {{ owmForecast, weatherApiForecast, smhi, met }} rawResults - settled promise results
 * @param {number} lat
 * @param {number} lon
 * @param {string} timezone - tz_id or UTC offset used when calling the forecast DTOs
 */
export const captureForecasts = async ({ owmForecast, weatherApiForecast, smhi, met }, lat, lon, timezone = 'UTC') => {
  try {
    const ProviderForecastSnapshot = sequelize.models.ProviderForecastSnapshot;
    if (!ProviderForecastSnapshot) return;

    const tomorrow = tomorrowUtc();
    const bound = getCoordinateBound(lat, lon);
    const country_code = COUNTRY_CODE_MAP[bound?.country] ?? 'GL';
    const rLat = roundCoord(lat);
    const rLon = roundCoord(lon);

    const snapshots = [
      extractProviderSnapshot(owmForecast, v => openWeatherMapsDto.forecastWeather(v), 'openweathermaps.org', tomorrow),
      extractProviderSnapshot(weatherApiForecast, v => weatherApiDto.forecastWeather(v), 'weatherapi.com', tomorrow),
      extractProviderSnapshot(smhi, v => smhiDto.forecastWeather(v, true, timezone), 'smhi.se', tomorrow),
      extractProviderSnapshot(met, v => metDto.forecastWeather(v, true, timezone), 'met.no', tomorrow),
    ].filter(Boolean).map(s => ({
      ...s,
      lat: rLat,
      lon: rLon,
      country_code,
      valid_for: tomorrow,
      forecasted_at: new Date(),
    }));

    if (!snapshots.length) return;

    // ignoreDuplicates skips rows that conflict on (provider, lat, lon, valid_for)
    await ProviderForecastSnapshot.bulkCreate(snapshots, { ignoreDuplicates: true });
  } catch (err) {
    devError('captureForecasts failed silently:', err?.message);
  }
};
