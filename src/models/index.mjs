import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config();

const connectionString = process.env.DATABASE_URL ||
  `postgres://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'express_api'}`;

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: false,
});

export { sequelize };
