import cron from 'node-cron';
import { flushRequestLogs } from './jobs/flush-request-logs.mjs';
import { purgeOldLogs } from './jobs/purge-old-logs.mjs';
import { evaluateProviderAccuracy } from './jobs/evaluate-provider-accuracy.mjs';
import { pollReferenceStations } from './jobs/poll-reference-stations.mjs';
import { logError } from './services/errorLog.service.mjs';
import { devError } from './utils/logger.mjs';

export const registerCronJobs = () => {
  const flushTask = cron.schedule('*/2 * * * *', async () => {
    try {
      await flushRequestLogs();
    } catch (err) {
      devError('Scheduled request log flush failed:', err);
      await logError(err, { route: 'cron:flush-request-logs' });
    }
  }, { timezone: 'UTC' });

  // Only register on the primary worker to avoid duplicate deletes across cluster workers.
  // NODE_APP_INSTANCE is set by PM2 cluster mode; absence means single-process (dev/test).
  const isPrimaryWorker = !process.env.NODE_APP_INSTANCE || process.env.NODE_APP_INSTANCE === '0';

  // Daily at 05:00 UTC — delete logs older than 6 months
  const purgeTask = isPrimaryWorker
    ? cron.schedule('0 5 * * *', async () => {
        try {
          await purgeOldLogs();
        } catch (err) {
          devError('Scheduled log purge failed:', err);
          await logError(err, { route: 'cron:purge-old-logs' });
        }
      }, { timezone: 'UTC' })
    : null;

  // Daily at 12:00 UTC — fetch weather for all reference station coordinates.
  // Runs at noon so providers have processed their morning model runs.
  // captureForecasts() inside allWeather() handles the snapshot insertion.
  const pollTask = isPrimaryWorker
    ? cron.schedule('0 12 * * *', async () => {
        try {
          await pollReferenceStations();
        } catch (err) {
          devError('Scheduled reference station poll failed:', err);
          await logError(err, { route: 'cron:poll-reference-stations' });
        }
      }, { timezone: 'UTC' })
    : null;

  // Daily at 06:00 UTC — evaluate yesterday's provider forecasts against observations.
  // Runs after 05:00 purge and after observation APIs have finalized the previous day's data.
  const accuracyTask = isPrimaryWorker
    ? cron.schedule('0 6 * * *', async () => {
        try {
          await evaluateProviderAccuracy();
        } catch (err) {
          devError('Scheduled accuracy evaluation failed:', err);
          await logError(err, { route: 'cron:evaluate-provider-accuracy' });
        }
      }, { timezone: 'UTC' })
    : null;

  console.log('cron: registered — flush(*/2min), purge(05:00 UTC), poll-stations(12:00 UTC), accuracy-eval(06:00 UTC)');

  return {
    stop: () => {
      flushTask.stop();
      purgeTask?.stop();
      pollTask?.stop();
      accuracyTask?.stop();
    },
  };
};
