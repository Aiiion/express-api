import { readdir } from 'node:fs/promises';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  `postgres://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'express_api'}`;

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: false,
});

const modelsDir = new URL('.', import.meta.url);

let initialized;

// Registers every `*.model.mjs` in this directory on the instance. Each file
// default-exports `sequelize => Model`, so a new model only needs its file —
// nothing lists them by hand. Memoized: `start()` and the standalone job
// entrypoints can all call it without defining a model twice.
const initModels = () => {
  initialized ??= (async () => {
    const files = (await readdir(modelsDir)).filter(file => file.endsWith('.model.mjs')).sort();
    for (const file of files) {
      const { default: init } = await import(new URL(file, modelsDir).href);
      init(sequelize);
    }
    return sequelize.models;
  })();
  return initialized;
};

export { initModels, sequelize };
