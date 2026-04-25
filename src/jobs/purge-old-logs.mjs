import dotenv from 'dotenv';
import { Op } from 'sequelize';
import { fileURLToPath } from 'url';
import { sequelize } from '../models/index.mjs';
import initLog from '../models/log.model.mjs';

dotenv.config();

export const purgeOldLogs = async () => {
  const cutoff = new Date(Date.now() - 183 * 86400000);

  const Log = sequelize.models.Log;
  const deleted = await Log.destroy({
    where: { created_at: { [Op.lt]: cutoff } },
  });

  console.log(`Purged ${deleted} log(s) older than 6 months`);
  return deleted;
};

// Run standalone when executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    try {
      await sequelize.authenticate();
      initLog(sequelize);
      await purgeOldLogs();
      process.exit(0);
    } catch (err) {
      console.error('Failed to purge old logs:', err);
      process.exit(1);
    }
  })();
}
