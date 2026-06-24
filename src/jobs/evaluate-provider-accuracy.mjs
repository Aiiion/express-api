import { fileURLToPath } from 'url';
import { Op } from 'sequelize';
import dotenv from 'dotenv';
import { sequelize } from '../models/index.mjs';
import initProviderForecastSnapshot from '../models/providerForecastSnapshot.model.mjs';
import initProviderAccuracyScore from '../models/providerAccuracyScore.model.mjs';
import smhiObsService from '../services/observations/smhiObs.service.mjs';
import frostObsService from '../services/observations/frostObs.service.mjs';
import fmiObsService from '../services/observations/fmiObs.service.mjs';
import openMeteoArchiveService from '../services/observations/openMeteoArchive.service.mjs';
import { devError } from '../utils/logger.mjs';

dotenv.config();

const WINDOW_DAYS = 30;

// Yesterday in UTC ('YYYY-MM-DD')
const yesterday = () => {
  const d = new Date(Date.now() - 86400000);
  return d.toISOString().slice(0, 10);
};

const mae = (errors) => {
  const valid = errors.filter(e => e != null && isFinite(e));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
};

const fetchObservation = async (countryCode, lat, lon, date) => {
  try {
    switch (countryCode) {
      case 'SE': return await smhiObsService.getDailyStats(lat, lon, date);
      case 'NO': return await frostObsService.getDailyStats(lat, lon, date);
      case 'FI': return await fmiObsService.getDailyStats(lat, lon, date);
      default:   return await openMeteoArchiveService.getDailyStats(lat, lon, date);
    }
  } catch (err) {
    devError(`fetchObservation failed for ${countryCode} (${lat},${lon}):`, err?.message);
    return null;
  }
};

export const evaluateProviderAccuracy = async () => {
  const ProviderForecastSnapshot = sequelize.models.ProviderForecastSnapshot;
  const ProviderAccuracyScore = sequelize.models.ProviderAccuracyScore;
  if (!ProviderForecastSnapshot || !ProviderAccuracyScore) return;

  const date = yesterday();

  // Find all unevaluated snapshots for yesterday
  const snapshots = await ProviderForecastSnapshot.findAll({
    where: { valid_for: date, evaluated: false },
  });

  if (!snapshots.length) return;

  // Group by (lat, lon, country_code) to fetch one observation per coordinate
  const coordMap = new Map();
  for (const snap of snapshots) {
    const key = `${snap.lat}:${snap.lon}:${snap.country_code}`;
    if (!coordMap.has(key)) {
      coordMap.set(key, { lat: parseFloat(snap.lat), lon: parseFloat(snap.lon), country_code: snap.country_code });
    }
  }

  // Fetch one observation per unique coordinate (in parallel, max 5 at a time)
  const obsMap = new Map();
  const coordEntries = [...coordMap.entries()];
  for (let i = 0; i < coordEntries.length; i += 5) {
    const batch = coordEntries.slice(i, i + 5);
    await Promise.all(batch.map(async ([key, { lat, lon, country_code }]) => {
      const obs = await fetchObservation(country_code, lat, lon, date);
      obsMap.set(key, obs);
    }));
  }

  // Persist observed values on each snapshot and mark evaluated.
  // Storing obs_* here means the 30-day window query below can compute errors
  // from the snapshot row alone, without needing to re-fetch historical observations.
  for (const [key, obs] of obsMap.entries()) {
    const idsForCoord = snapshots
      .filter(s => `${s.lat}:${s.lon}:${s.country_code}` === key)
      .map(s => s.id);
    await ProviderForecastSnapshot.update({
      evaluated: true,
      obs_avg_temp:       obs?.avg_temp       ?? null,
      obs_total_precip:   obs?.total_precip   ?? null,
      obs_avg_wind_speed: obs?.avg_wind_speed ?? null,
      obs_avg_humidity:   obs?.avg_humidity   ?? null,
    }, { where: { id: { [Op.in]: idsForCoord } } });
  }

  // Recompute MAE for each (provider, country_code) from the past WINDOW_DAYS days.
  // obs_* columns carry the ground-truth values so every row in the window is scoreable.
  const windowStart = new Date(Date.now() - WINDOW_DAYS * 86400000).toISOString().slice(0, 10);

  const allEvaluated = await ProviderForecastSnapshot.findAll({
    where: {
      evaluated: true,
      valid_for: { [Op.gte]: windowStart },
    },
  });

  // Build per-(provider, country_code) error lists
  const errorMap = new Map();

  for (const snap of allEvaluated) {
    const pk = `${snap.provider}::${snap.country_code}`;
    if (!errorMap.has(pk)) {
      errorMap.set(pk, { provider: snap.provider, country_code: snap.country_code, tempErrors: [], precipErrors: [], windErrors: [], humidityErrors: [] });
    }
    const e = errorMap.get(pk);

    if (snap.avg_temp != null && snap.obs_avg_temp != null)           e.tempErrors.push(Math.abs(snap.avg_temp - snap.obs_avg_temp));
    if (snap.total_precip != null && snap.obs_total_precip != null)   e.precipErrors.push(Math.abs(snap.total_precip - snap.obs_total_precip));
    if (snap.avg_wind_speed != null && snap.obs_avg_wind_speed != null) e.windErrors.push(Math.abs(snap.avg_wind_speed - snap.obs_avg_wind_speed));
    if (snap.avg_humidity != null && snap.obs_avg_humidity != null)   e.humidityErrors.push(Math.abs(snap.avg_humidity - snap.obs_avg_humidity));
  }

  // Upsert accuracy scores
  for (const { provider, country_code, tempErrors, precipErrors, windErrors, humidityErrors } of errorMap.values()) {
    const totalSamples = Math.max(tempErrors.length, precipErrors.length, windErrors.length, humidityErrors.length);
    if (totalSamples === 0) continue;

    await ProviderAccuracyScore.upsert({
      provider,
      country_code,
      temp_mae: mae(tempErrors),
      precip_mae: mae(precipErrors),
      wind_mae: mae(windErrors),
      humidity_mae: mae(humidityErrors),
      sample_count: totalSamples,
      computed_at: new Date(),
    }, { conflictFields: ['provider', 'country_code'] });
  }

  return { evaluated: snapshots.length, coords: coordMap.size };
};

// Run standalone when executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    try {
      await sequelize.authenticate();
      initProviderForecastSnapshot(sequelize);
      initProviderAccuracyScore(sequelize);
      const result = await evaluateProviderAccuracy();
      console.log('Done:', result);
      process.exit(0);
    } catch (err) {
      devError('evaluate-provider-accuracy failed:', err);
      process.exit(1);
    }
  })();
}
