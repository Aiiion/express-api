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

const start = async () => {
  try {
    await connect();
    // initialize sequelize models (no sync here; migrations manage schema)
    initLog(sequelize);
    await sequelize.authenticate();
    server = app.listen(port, () => {
      console.log(`server running on port ${port}.`);
    });
  } catch (err) {
    console.error('Failed to start app due to DB error');
    process.exit(1);
  }
};

start();

export { server };
export default app;