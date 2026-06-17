import cron from 'node-cron';
import { flushRequestLogs } from './jobs/flush-request-logs.mjs';
import { purgeOldLogs } from './jobs/purge-old-logs.mjs';
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

  return {
    stop: () => {
      flushTask.stop();
      purgeTask?.stop();
    },
  };
};
