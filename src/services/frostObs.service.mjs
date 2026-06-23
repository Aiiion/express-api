import { FROST_API_URL } from '../utils/constants.mjs';
import userAgent from '../utils/userAgent.mjs';

// Frost API uses Basic auth: client_id as username, empty password
const authHeader = () => {
  const clientId = process.env.MET_FROST_CLIENT_ID ?? '';
  return 'Basic ' + Buffer.from(`${clientId}:`).toString('base64');
};

const ELEMENTS = [
  'air_temperature',
  'sum(precipitation_amount PT1H)',
  'wind_speed',
  'relative_humidity',
  'air_pressure_at_sea_level',
].join(',');

const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

/**
 * Returns observed daily stats for the given lat/lon from the nearest Frost (MET Norway) station.
 * Fetches the full previous calendar day in UTC.
 * @returns {{ avg_temp, total_precip, avg_wind_speed, avg_humidity, avg_pressure } | null}
 */
const frostObsService = {
  getDailyStats: async (lat, lon, date) => {
    // date: 'YYYY-MM-DD' — the day to evaluate (yesterday)
    const refTime = `${date}T00:00:00Z/${date}T23:59:59Z`;
    const source = `nearest(POINT(${lon} ${lat}))`;

    const url = new URL(FROST_API_URL);
    url.searchParams.set('sources', source);
    url.searchParams.set('elements', ELEMENTS);
    url.searchParams.set('referencetime', refTime);
    url.searchParams.set('timeresolutions', 'PT1H');

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(8000),
      headers: {
        Authorization: authHeader(),
        'User-Agent': userAgent.headers?.['User-Agent'] ?? 'express-api',
      },
    });
    if (!res.ok) throw new Error(`Frost API error: ${res.status}`);
    const json = await res.json();

    const observations = json.data ?? [];

    const temps = [], precips = [], winds = [], humidities = [], pressures = [];

    for (const obs of observations) {
      for (const o of obs.observations ?? []) {
        const val = parseFloat(o.value);
        if (isNaN(val)) continue;
        const el = o.elementId ?? '';
        if (el === 'air_temperature') temps.push(val);
        else if (el.startsWith('sum(precipitation')) precips.push(val);
        else if (el === 'wind_speed') winds.push(val);
        else if (el === 'relative_humidity') humidities.push(val);
        else if (el === 'air_pressure_at_sea_level') pressures.push(val);
      }
    }

    return {
      avg_temp: avg(temps),
      total_precip: precips.length ? precips.reduce((a, b) => a + b, 0) : null,
      avg_wind_speed: avg(winds),
      avg_humidity: avg(humidities),
      avg_pressure: avg(pressures),
    };
  },
};

export default frostObsService;
