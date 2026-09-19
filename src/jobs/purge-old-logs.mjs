import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { Op } from 'sequelize';
import { initModels, sequelize } from '../models/index.mjs';
import { devError } from '../utils/logger.mjs';

dotenv.config();

export const purgeOldLogs = async () => {
  const cutoff = new Date(Date.now() - 183 * 86400000);

  const RequestLog = sequelize.models.RequestLog;
  const deletedRequests = await RequestLog.destroy({
    where: { created_at: { [Op.lt]: cutoff } },
  });

  const ErrorLog = sequelize.models.ErrorLog;
  const deletedErrors = await ErrorLog.destroy({
    where: { created_at: { [Op.lt]: cutoff } },
  });

  return { deletedRequests, deletedErrors };
};

// Run standalone when executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    try {
      await sequelize.authenticate();
      await initModels();
      await purgeOldLogs();
      process.exit(0);
    } catch (err) {
      devError('Failed to purge old logs:', err);
      process.exit(1);
    }
  })();
}
