import { sequelize } from '../../models/index.mjs';
import { distinct } from '../../services/meta.service.mjs';

export const index = async (_req, res) => {
  const Location = sequelize.models.Location;
  const fields = Object.keys(Location.getAttributes());

  return res.status(200).json({
    data: {
      resource: 'Location',
      values: fields,
      count: fields.length,
    },
  });
};

export const show = async (req, res) => {
  const Location = sequelize.models.Location;
  const field = req.params.field;
  const result = await distinct(Location, field);

  return res.status(200).json({
    data: result,
  });
};
