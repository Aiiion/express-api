import dotenv from 'dotenv';
import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from '../models/index.mjs';

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
      console.log('DB connection ok, reverting last seeder...');
      await umzug.down();
      console.log('Seeder reverted');
    } else {
      console.log('DB connection ok, running seeders...');
      await umzug.up();
      console.log('Seeders applied');
    }
    process.exit(0);
  } catch (err) {
    console.error('Seeder failed', err);
    process.exit(1);
  }
};

run();
