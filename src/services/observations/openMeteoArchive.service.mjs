import { OPEN_METEO_ARCHIVE_URL } from '../../utils/constants.mjs';
import userAgent from '../../utils/userAgent.mjs';

const HOURLY_VARS = [
  'temperature_2m',
  'precipitation',
  'wind_speed_10m',
  'relative_humidity_2m',
  'surface_pressure',
].join(',');

const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

/**
 * Returns observed daily stats from Open-Meteo ERA5 reanalysis for any global coordinate.
 * Used as the ground-truth source for coordinates outside SE/NO/FI.
 * @param {number} lat
 * @param {number} lon
 * @param {string} date - 'YYYY-MM-DD'
 * @returns {{ avg_temp, total_precip, avg_wind_speed, avg_humidity, avg_pressure } | null}
 */
const openMeteoArchiveService = {
  getDailyStats: async (lat, lon, date) => {
    const url = new URL(OPEN_METEO_ARCHIVE_URL);
    url.searchParams.set('latitude', lat);
    url.searchParams.set('longitude', lon);
    url.searchParams.set('start_date', date);
    url.searchParams.set('end_date', date);
    url.searchParams.set('hourly', HOURLY_VARS);
    url.searchParams.set('wind_speed_unit', 'ms');
    url.searchParams.set('timezone', 'UTC');

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
      ...userAgent,
    });
    if (!res.ok) throw new Error(`Open-Meteo archive error: ${res.status}`);
    const json = await res.json();

    const h = json.hourly;
    if (!h) return null;

    const validValues = (arr) => (arr ?? []).filter(v => v != null && !isNaN(v));

    return {
      avg_temp: avg(validValues(h.temperature_2m)),
      total_precip: validValues(h.precipitation).reduce((a, b) => a + b, 0) || null,
      avg_wind_speed: avg(validValues(h.wind_speed_10m)),
      avg_humidity: avg(validValues(h.relative_humidity_2m)),
      avg_pressure: avg(validValues(h.surface_pressure)),
    };
  },
};

export default openMeteoArchiveService;
