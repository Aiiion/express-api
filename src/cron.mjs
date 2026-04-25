import cron from 'node-cron';
import { purgeOldLogs } from './jobs/purge-old-logs.mjs';

export const registerCronJobs = () => {
  // Daily at 05:00 UTC — delete logs older than 6 months
  cron.schedule('0 5 * * *', async () => {
    try {
      await purgeOldLogs();
    } catch (err) {
      console.error('Scheduled log purge failed:', err);
    }
  }, { timezone: 'UTC' });
};
