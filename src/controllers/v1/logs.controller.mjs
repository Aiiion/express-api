import { Op } from 'sequelize';
import { sequelize } from '../../models/index.mjs';

const LOGS_PER_PAGE = 100;

export const index = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const offset = (page - 1) * LOGS_PER_PAGE;

    const where = {};

    if (req.query.code !== undefined) {
      const code = parseInt(req.query.code, 10);
      if (!isNaN(code)) {
        where.code = code;
      }
    }

    if (req.query.search) {
      const pattern = `%${req.query.search}%`;
      where[Op.or] = [
        { route: { [Op.iLike]: pattern } },
        { ip: { [Op.iLike]: pattern } },
        { description: { [Op.iLike]: pattern } }
      ];
    }

    const Log = sequelize.models.Log;
    const { count, rows } = await Log.findAndCountAll({
      where,
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
