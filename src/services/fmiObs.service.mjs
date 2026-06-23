import { FMI_WFS_URL } from '../utils/constants.mjs';
import { fetchWfsBsSimple } from '../utils/wfs.mjs';

const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

/**
 * Returns observed daily stats for the given lat/lon from the nearest FMI station.
 * Uses the fmi::observations::weather::simple stored query.
 * @param {number} lat
 * @param {number} lon
 * @param {string} date - 'YYYY-MM-DD' (the day to evaluate, i.e. yesterday)
 * @returns {{ avg_temp, total_precip, avg_wind_speed, avg_humidity, avg_pressure } | null}
 */
const fmiObsService = {
  getDailyStats: async (lat, lon, date) => {
    const { timeSeries } = await fetchWfsBsSimple(FMI_WFS_URL, {
      storedquery_id: 'fmi::observations::weather::simple',
      latlon: `${lat},${lon}`,
      starttime: `${date}T00:00:00Z`,
      endtime: `${date}T23:59:59Z`,
      timestep: '60',
      parameters: 'temperature,humidity,windspeedms,winddirection,precipitation1h,pressure',
    });

    if (!timeSeries?.length) return null;

    const temps = [], winds = [], humidities = [], pressures = [], precips = [];

    for (const entry of timeSeries) {
      if (entry.temperature != null) temps.push(entry.temperature);
      if (entry.windspeedms != null) winds.push(entry.windspeedms);
      if (entry.humidity != null) humidities.push(entry.humidity);
      if (entry.pressure != null) pressures.push(entry.pressure);
      if (entry.precipitation1h != null) precips.push(entry.precipitation1h);
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

export default fmiObsService;
