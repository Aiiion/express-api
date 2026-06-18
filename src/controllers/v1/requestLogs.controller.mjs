import { Op } from 'sequelize';
import { matchedData } from 'express-validator';
import { sequelize } from '../../models/index.mjs';

const LOGS_PER_PAGE = 100;

export const index = async (req, res) => {
  const { page = 1, code, search } = matchedData(req);
  const offset = (page - 1) * LOGS_PER_PAGE;

  const where = {};

  if (code !== undefined) {
    where.code = code.length === 1 ? code[0] : { [Op.in]: code };
  }

  if (search) {
    const pattern = `%${search}%`;
    where[Op.or] = [
      { route: { [Op.iLike]: pattern } },
      { ip: { [Op.iLike]: pattern } },
      { description: { [Op.iLike]: pattern } }
    ];
  }

  const RequestLog = sequelize.models.RequestLog;
  const { count, rows } = await RequestLog.findAndCountAll({
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
