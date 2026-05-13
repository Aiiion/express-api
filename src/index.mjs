import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import routes from "./routes/index.route.mjs";
import cors from 'cors';
import { connect, closePool } from './services/db.service.mjs';
import { sequelize } from './models/index.mjs';
import { handleError } from './middleware/handleError.middleware.mjs';
import { logRequest } from './middleware/log.middleware.mjs';
import initRequestLog from './models/requestLog.model.mjs';
import initErrorLog from './models/errorLog.model.mjs';
import { closeRedisConnection, ensureRedisConnection } from './services/redis.service.mjs';
import { createStrictCorsOptionsDelegate } from './utils/corsHelpers.mjs';
import { registerCronJobs } from './cron.mjs';
dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors(createStrictCorsOptionsDelegate()));
app.use(logRequest());
app.use(routes);
app.use(handleError);

const port = process.env.PORT || 3000;

let server;
let cronHandle;

const start = async (listenPort = port) => {
  try {
    await connect();
    await ensureRedisConnection();
    // initialize sequelize models (no sync here; migrations manage schema)
    initRequestLog(sequelize);
    initErrorLog(sequelize);
    await sequelize.authenticate();
    if (!cronHandle) {
      cronHandle = registerCronJobs();
    }
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
  if (cronHandle) {
    cronHandle.stop();
    cronHandle = undefined;
  }
  try {
    await closePool();
    await sequelize.close();
    await closeRedisConnection();
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
