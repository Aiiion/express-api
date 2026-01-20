import dotenv from 'dotenv';
import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from '../models/index.mjs';

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
      console.log('DB connection ok, reverting last migration...');
      await umzug.down();
      console.log('Migration reverted');
    } else {
      console.log('DB connection ok, running migrations...');
      await umzug.up();
      console.log('Migrations applied');
    }
    process.exit(0);
  } catch (err) {
    console.error('Migration failed', err);
    process.exit(1);
  }
};

run();
