import dotenv from 'dotenv';
import { initModels, sequelize } from '../models/index.mjs';
import { devError, devLog } from '../utils/logger.mjs';

dotenv.config();

const run = async () => {
  if (process.env.NODE_ENV === 'production') {
    devError('Syncing database in production is not allowed. Use migrations instead.');
    process.exit(1);
  }

  try {
    await sequelize.authenticate();
    devLog('Database connection OK');
    await initModels();
    await sequelize.sync({ alter: true });
    devLog('Database synced (models applied)');
    process.exit(0);
  } catch (err) {
    devError('Database sync failed:', err);
    process.exit(1);
  }
};

run();
