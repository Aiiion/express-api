import { Op } from 'sequelize';
import { matchedData } from 'express-validator';
import { sequelize } from '../../models/index.mjs';

const PER_PAGE = 100;

export const index = async (req, res) => {
  const { page = 1, provider, country_code, evaluated } = matchedData(req);
  const offset = (page - 1) * PER_PAGE;

  const where = {};

  if (provider !== undefined) {
    where.provider = Array.isArray(provider)
      ? { [Op.in]: provider }
      : provider;
  }

  if (country_code !== undefined) {
    where.country_code = country_code;
  }

  if (evaluated !== undefined) {
    where.evaluated = evaluated;
  }

  const ProviderForecastSnapshot = sequelize.models.ProviderForecastSnapshot;
  const { count, rows } = await ProviderForecastSnapshot.findAndCountAll({
    where,
    limit: PER_PAGE,
    offset,
    order: [['valid_for', 'DESC'], ['forecasted_at', 'DESC']],
  });

  const totalPages = Math.ceil(count / PER_PAGE);

  return res.status(200).json({
    data: rows,
    pagination: {
      page,
      perPage: PER_PAGE,
      totalPages,
      totalCount: count,
    },
  });
};
