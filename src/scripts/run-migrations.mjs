import dotenv from 'dotenv';
import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from '../models/index.mjs';
import { devLog, devError } from '../utils/logger.mjs';

dotenv.config();

const umzug = new Umzug({
  migrations: { glob: 'src/db/migrations/*.js' },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

const run = async () => {
  const action = process.argv[2] || 'up';
  try {
    await sequelize.authenticate();
    if (action === 'down') {
      devLog('DB connection ok, reverting last migration...');
      await umzug.down();
      devLog('Migration reverted');
    } else {
      devLog('DB connection ok, running migrations...');
      await umzug.up();
      devLog('Migrations applied');
    }
    process.exit(0);
  } catch (err) {
    devError('Migration failed', err);
    process.exit(1);
  }
};

run();
