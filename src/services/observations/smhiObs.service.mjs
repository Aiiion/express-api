import { SMHI_METOBS_API_URL } from '../utils/constants.mjs';
import { withCache } from './redis.service.mjs';
import userAgent from '../utils/userAgent.mjs';

// Parameters used for accuracy evaluation
const PARAMS = {
  temperature: 1,   // instantaneous hourly, °C
  windSpeed: 4,     // 10-min avg hourly, m/s
  precipitation: 7, // hourly total, mm
  humidity: 6,      // hourly, %
  pressure: 9,      // hourly, hPa
};

const STATION_CACHE_TTL = 86400; // 24h — station lists change rarely

const fetchStations = async (parameterId) => {
  const cacheKey = `smhiobs:stations:${parameterId}`;
  return withCache(cacheKey, STATION_CACHE_TTL, async () => {
    const res = await fetch(`${SMHI_METOBS_API_URL}/parameter/${parameterId}.json`, {
      signal: AbortSignal.timeout(5000),
      ...userAgent,
    });
    if (!res.ok) throw new Error(`SMHI metobs stations error: ${res.status}`);
    const json = await res.json();
    // Each station in `station` array has id, latitude, longitude, active
    return (json.station ?? [])
      .filter(s => s.active !== false)
      .map(s => ({ id: s.id, lat: s.latitude, lon: s.longitude }));
  });
};

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const nearestStation = (stations, lat, lon) => {
  let best = null;
  let bestDist = Infinity;
  for (const s of stations) {
    const d = haversineKm(lat, lon, s.lat, s.lon);
    if (d < bestDist) { bestDist = d; best = s; }
  }
  return best;
};

const fetchObservations = async (parameterId, stationId) => {
  const res = await fetch(
    `${SMHI_METOBS_API_URL}/parameter/${parameterId}/station/${stationId}/period/latest-day/data.json`,
    { signal: AbortSignal.timeout(5000), ...userAgent }
  );
  if (!res.ok) throw new Error(`SMHI metobs data error: ${res.status}`);
  const json = await res.json();
  // json.value is [{date: epochMs (string), value: "13.6", quality: "G"}, ...]
  return (json.value ?? [])
    .filter(v => v.quality === 'G' || v.quality === 'Y')
    .map(v => ({ epochMs: Number(v.date), value: parseFloat(v.value) }))
    .filter(v => !isNaN(v.value));
};

const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

/**
 * Returns observed daily stats for the given lat/lon from the nearest SMHI station.
 * Uses latest-day data (covers roughly the past 24 hours).
 * @returns {{ avg_temp, total_precip, avg_wind_speed, avg_humidity, avg_pressure } | null}
 */
const smhiObsService = {
  getDailyStats: async (lat, lon) => {
    const [tempStations, windStations, precipStations, humidityStations, pressureStations] =
      await Promise.all(Object.values(PARAMS).map(fetchStations));

    const stationSets = [tempStations, windStations, precipStations, humidityStations, pressureStations];
    const stationIds = stationSets.map(stations => nearestStation(stations, lat, lon)?.id);

    const [tempObs, windObs, precipObs, humidityObs, pressureObs] = await Promise.all(
      Object.values(PARAMS).map((paramId, i) =>
        stationIds[i] ? fetchObservations(paramId, stationIds[i]).catch(() => []) : Promise.resolve([])
      )
    );

    return {
      avg_temp: avg(tempObs.map(o => o.value)),
      total_precip: precipObs.reduce((sum, o) => sum + o.value, 0) || null,
      avg_wind_speed: avg(windObs.map(o => o.value)),
      avg_humidity: avg(humidityObs.map(o => o.value)),
      avg_pressure: avg(pressureObs.map(o => o.value)),
    };
  },
};

export default smhiObsService;
