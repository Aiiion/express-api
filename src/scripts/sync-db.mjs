import dotenv from 'dotenv';
import { sequelize } from '../models/index.mjs';
import initRequestLog from '../models/requestLog.model.mjs';
import { devLog, devError } from '../utils/logger.mjs';

dotenv.config();

// Initialize models
initRequestLog(sequelize);

const run = async () => {
  if(process.env.NODE_ENV === 'production') {
    devError('Syncing database in production is not allowed. Use migrations instead.');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    devLog('Database connection OK');
    await sequelize.sync({ alter: true });
    devLog('Database synced (models applied)');
    process.exit(0);
  } catch (err) {
    devError('Database sync failed:', err);
    process.exit(1);
  }
};

run();
