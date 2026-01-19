import dotenv from 'dotenv';
import { sequelize } from '../models/index.mjs';
import initLog from '../models/log.model.mjs';

dotenv.config();

// Initialize models
initLog(sequelize);

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection OK');
    await sequelize.sync({ alter: true });
    console.log('Database synced (models applied)');
    process.exit(0);
  } catch (err) {
    console.error('Database sync failed:', err);
    process.exit(1);
  }
};

run();
