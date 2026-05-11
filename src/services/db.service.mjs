import dotenv from 'dotenv';
import { Pool } from 'pg';
import { devLog, devError } from '../utils/logger.mjs';

dotenv.config();

const REQUIRED_DB_VARS = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = REQUIRED_DB_VARS.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  throw new Error(`Missing required database environment variables: ${missingVars.join(', ')}`);
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const closePool = async () => pool.end();

const connect = async () => {
  try {
    await pool.query('SELECT 1');
    devLog('Postgres connected');
  } catch (err) {
    devError('Postgres connection error:', err);
    throw err;
  }
};

const query = (text, params) => pool.query(text, params);

export { pool, query, connect, closePool };
