import cron from 'node-cron';
import { purgeOldLogs } from './jobs/purge-old-logs.mjs';
import { logError } from './services/errorLog.service.mjs';
import { devError } from './utils/logger.mjs';

export const registerCronJobs = () => {
  // Daily at 05:00 UTC — delete logs older than 6 months
  const task = cron.schedule('0 5 * * *', async () => {
    try {
      await purgeOldLogs();
    } catch (err) {
      devError('Scheduled log purge failed:', err);
      await logError(err, { route: 'cron:purge-old-logs' });
    }
  }, { timezone: 'UTC' });
  return task;
};
