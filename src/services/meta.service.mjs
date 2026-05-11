import { sequelize } from '../models/index.mjs';
import { devError } from '../utils/logger.mjs';

export const distinct = async (model, field) => {
  const LIMIT = 1000; // Define a reasonable limit for distinct values to prevent performance issues
  try {
    const rows = await model.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col(field)), field]],
      order: [[field, 'ASC']],
      raw: true,
      limit: LIMIT
    });

    return {
      field,
      values: rows.map((r) => r[field]),
      count: rows.length,
      limited: rows.length === LIMIT // Indicate if the results were limited
    };
  } catch (error) {
    devError(`Failed to retrieve distinct values for ${field}:`, error.message);
    throw error;
  }
};
