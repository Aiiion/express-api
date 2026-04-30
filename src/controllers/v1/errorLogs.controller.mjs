import { Op } from 'sequelize';
import { sequelize } from '../../models/index.mjs';

const LOGS_PER_PAGE = 100;

export const index = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const offset = (page - 1) * LOGS_PER_PAGE;

    const where = {};

    if (req.query.level !== undefined) {
      const levels = Array.isArray(req.query.level)
        ? req.query.level
        : [req.query.level];

      if (levels.length === 1) {
        where.level = levels[0];
      } else if (levels.length > 1) {
        where.level = { [Op.in]: levels };
      }
    }

    if (req.query.search) {
      const pattern = `%${req.query.search}%`;
      where[Op.or] = [
        { message: { [Op.iLike]: pattern } },
        { route: { [Op.iLike]: pattern } },
        { stack_trace: { [Op.iLike]: pattern } }
      ];
    }

    const ErrorLog = sequelize.models.ErrorLog;
    const { count, rows } = await ErrorLog.findAndCountAll({
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
    console.error('error logs index error:', error.message);
    return res.status(500).json({
      error: 'Failed to retrieve error logs'
    });
  }
};
