import { distinct } from '../../services/meta.service.mjs';
import { sequelize } from '../../models/index.mjs';

export const index = async (req, res) => {
  const ErrorLog = sequelize.models.ErrorLog;
  const fields = Object.keys(ErrorLog.getAttributes());

  return res.status(200).json({
    data: {
      resource: 'ErrorLog',
      values: fields,
      count: fields.length
    }
  });
};

export const show = async (req, res) => {
  const ErrorLog = sequelize.models.ErrorLog;
  const field = req.params.field;
  const result = await distinct(ErrorLog, field);

  return res.status(200).json({
    data: result
  });
};
