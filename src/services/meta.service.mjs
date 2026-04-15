import { sequelize } from '../models/index.mjs';

export const distinct = async (model, field) => {
  try {
    const rows = await model.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col(field)), field]],
      order: [[field, 'ASC']],
      raw: true,
      limit: 1000 // Add a reasonable limit to prevent excessive data retrieval
    });

    return {
      field,
      values: rows.map((r) => r[field]),
      count: rows.length
    };
  } catch (error) {
    console.error(`Failed to retrieve distinct values for ${field}:`, error.message);
    throw error;
  }
};
