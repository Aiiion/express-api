import { Op } from 'sequelize';
import { matchedData } from 'express-validator';
import { sequelize } from '../../models/index.mjs';

const LOGS_PER_PAGE = 100;

export const index = async (req, res) => {
  const { page = 1, search } = matchedData(req);
  const offset = (page - 1) * LOGS_PER_PAGE;

  const where = {};

  if (search) {
    const pattern = `%${search}%`;
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
};
