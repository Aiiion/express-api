import dotenv from 'dotenv';
import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from '../models/index.mjs';
import { devLog, devError } from '../utils/logger.mjs';

dotenv.config();

const umzug = new Umzug({
  migrations: { glob: 'src/db/seeders/*.js' },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ 
    sequelize,
    tableName: 'seeder_meta'
  }),
  logger: console,
});

const run = async () => {
  const action = process.argv[2] || 'up';
  try {
    await sequelize.authenticate();
    if (action === 'down') {
      devLog('DB connection ok, reverting last seeder...');
      await umzug.down();
      devLog('Seeder reverted');
    } else {
      devLog('DB connection ok, running seeders...');
      await umzug.up();
      devLog('Seeders applied');
    }
    process.exit(0);
  } catch (err) {
    devError('Seeder failed', err);
    process.exit(1);
  }
};

run();
