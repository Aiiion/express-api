import { sequelize } from '../../models/index.mjs';

const LOGS_PER_PAGE = 100;

export const index = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const offset = (page - 1) * LOGS_PER_PAGE;

    const Log = sequelize.models.Log;
    const { count, rows } = await Log.findAndCountAll({
      limit: LOGS_PER_PAGE,
      offset,
      order: [['created_at', 'DESC']]
    });

    const totalPages = Math.ceil(count / LOGS_PER_PAGE);

    return res.status(200).json({
      data: rows,
      pagination: {
        page,
        perPage: LOGS_PER_PAGE,
        totalPages,
        totalCount: count
      }
    });
  } catch (error) {
    console.error('logs index error:', error.message);
    return res.status(500).json({
      error: 'Failed to retrieve logs'
    });
  }
};
