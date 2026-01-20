import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'express_api',
});

const closePool = async () => pool.end();

const connect = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Postgres connected');
  } catch (err) {
    console.error('Postgres connection error:', err);
    throw err;
  }
};

export const query = (text, params) => pool.query(text, params);

export { pool, query, connect, closePool };
