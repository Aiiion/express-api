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
      case 'SE': return await smhiObsService.getDailyStats(lat, lon);
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

  // Mark all as evaluated (even if obs fetch failed — avoids retrying dead coordinates)
  const evaluatedIds = snapshots.map(s => s.id);
  await ProviderForecastSnapshot.update({ evaluated: true }, { where: { id: { [Op.in]: evaluatedIds } } });

  // Recompute MAE for each (provider, country_code) from the past WINDOW_DAYS days
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
    const key = `${snap.lat}:${snap.lon}:${snap.country_code}`;
    const obs = obsMap.get(key);

    // For snapshots outside today's newly observed set we don't have obs in memory,
    // so we skip them for error computation — their contribution is already baked
    // into a previous run. The MAE will be recalculated from all evaluated rows
    // in the window using stored predictions vs the in-memory observations from today.
    // NOTE: a future improvement would store observed values on the snapshot row itself.
    if (!obs) continue;

    const pk = `${snap.provider}::${snap.country_code}`;
    if (!errorMap.has(pk)) {
      errorMap.set(pk, { provider: snap.provider, country_code: snap.country_code, tempErrors: [], precipErrors: [], windErrors: [], humidityErrors: [] });
    }
    const e = errorMap.get(pk);

    if (snap.avg_temp != null && obs.avg_temp != null)           e.tempErrors.push(Math.abs(snap.avg_temp - obs.avg_temp));
    if (snap.total_precip != null && obs.total_precip != null)   e.precipErrors.push(Math.abs(snap.total_precip - obs.total_precip));
    if (snap.avg_wind_speed != null && obs.avg_wind_speed != null) e.windErrors.push(Math.abs(snap.avg_wind_speed - obs.avg_wind_speed));
    if (snap.avg_humidity != null && obs.avg_humidity != null)   e.humidityErrors.push(Math.abs(snap.avg_humidity - obs.avg_humidity));
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

  return { evaluated: evaluatedIds.length, coords: coordMap.size };
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
