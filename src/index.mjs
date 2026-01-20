import express from 'express';
import dotenv from 'dotenv';
import routes from "./routes/index.mjs";
import cors from 'cors';
import { connect } from './services/db.service.mjs';
import { sequelize } from './models/index.mjs';
import initLog from './models/log.model.mjs';
dotenv.config();

const app = express();

app.use(express.json());
app.use(routes);
app.use(cors({
  origin: '*'
}));

const port = process.env.PORT || 3000;

let server;

const start = async (listenPort = port) => {
  try {
    await connect();
    // initialize sequelize models (no sync here; migrations manage schema)
    initLog(sequelize);
    await sequelize.authenticate();
    return new Promise((resolve, reject) => {
      server = app.listen(listenPort, () => {
        console.log(`server running on port ${listenPort}.`);
        resolve(server);
      });
      server.on('error', (err) => reject(err));
    });
  } catch (err) {
    console.error('Failed to start app due to DB error', err);
    throw err;
  }
};

const stop = async () => {
  if (server && typeof server.close === 'function') {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    server = undefined;
  }
  try {
    await sequelize.close();
  } catch (e) {
    // ignore close errors
  }
};

// Auto-start unless running tests
if (process.env.NODE_ENV !== 'test') {
  start().catch(() => process.exit(1));
}

export { start, stop };
export default app;