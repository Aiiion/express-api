import { matchedData } from 'express-validator';
import { Op, UniqueConstraintError } from 'sequelize';
import { sequelize } from '../../models/index.mjs';

const PER_PAGE = 25;

const notFound = res => res.status(404).json({ code: 404, message: 'Location not found' });

const nameTaken = res => res.status(409).json({ code: 409, message: 'A location with that name already exists' });

export const index = async (req, res) => {
  const { page = 1, search } = matchedData(req);
  const offset = (page - 1) * PER_PAGE;

  const where = {};

  if (search) {
    const pattern = `%${search}%`;
    where[Op.or] = [{ name: { [Op.iLike]: pattern } }, { provider_name: { [Op.iLike]: pattern } }];
  }

  const Location = sequelize.models.Location;
  const { count, rows } = await Location.findAndCountAll({
    where,
    limit: PER_PAGE,
    offset,
    order: [['name', 'ASC']],
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

export const show = async (req, res) => {
  const { id } = matchedData(req);

  const Location = sequelize.models.Location;
  const location = await Location.findByPk(id);
  if (!location) return notFound(res);

  return res.status(200).json({ data: location });
};

// No findOne pre-check: check-then-insert races between two requests, so the
// unique index on lower(name) is the source of truth and its violation is
// mapped to a 409 here. Anything else propagates to handleError.
export const store = async (req, res) => {
  const { name, provider_name, lat, lon } = matchedData(req);

  const Location = sequelize.models.Location;
  try {
    const location = await Location.create({ name, provider_name, lat, lon });
    return res.status(201).json({ data: location });
  } catch (err) {
    if (err instanceof UniqueConstraintError) return nameTaken(res);
    throw err;
  }
};

export const update = async (req, res) => {
  const { id, ...changes } = matchedData(req);

  if (Object.keys(changes).length === 0) {
    return res.status(400).json({ code: 400, message: 'No fields to update' });
  }

  const Location = sequelize.models.Location;
  const location = await Location.findByPk(id);
  if (!location) return notFound(res);

  try {
    await location.update({ ...changes, updated_at: new Date() });
    return res.status(200).json({ data: location });
  } catch (err) {
    if (err instanceof UniqueConstraintError) return nameTaken(res);
    throw err;
  }
};

export const destroy = async (req, res) => {
  const { id } = matchedData(req);

  const Location = sequelize.models.Location;
  const deleted = await Location.destroy({ where: { id } });
  if (deleted === 0) return notFound(res);

  return res.status(204).end();
};
