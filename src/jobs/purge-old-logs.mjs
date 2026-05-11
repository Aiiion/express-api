import dotenv from 'dotenv';
import { Op } from 'sequelize';
import { fileURLToPath } from 'url';
import { sequelize } from '../models/index.mjs';
import initRequestLog from '../models/requestLog.model.mjs';
import initErrorLog from '../models/errorLog.model.mjs';

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
      initRequestLog(sequelize);
      initErrorLog(sequelize);
      await purgeOldLogs();
      process.exit(0);
    } catch (err) {
      console.error('Failed to purge old logs:', err);
      process.exit(1);
    }
  })();
}
