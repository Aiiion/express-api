import { distinct } from '../../services/meta.service.mjs';
import { sequelize } from '../../models/index.mjs';

export const index = async (req, res) => {
  const RequestLog = sequelize.models.RequestLog;
  const fields = Object.keys(RequestLog.getAttributes());

  return res.status(200).json({
    data: {
      resource: 'RequestLog',
      values: fields,
      count: fields.length
    }
  });
};

export const show = async (req, res) => {
  const RequestLog = sequelize.models.RequestLog;
  const field = req.params.field;
  const result = await distinct(RequestLog, field);

  return res.status(200).json({
    data: result
  });
};
