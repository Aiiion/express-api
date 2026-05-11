import { distinct } from '../../services/meta.service.mjs';
import { sequelize } from '../../models/index.mjs';
import { devError } from '../../utils/logger.mjs';

export const index = async (req, res) => {
  try {
    const RequestLog = sequelize.models.RequestLog;
    const fields = Object.keys(RequestLog.getAttributes());

    return res.status(200).json({
      data: {
        resource: 'RequestLog',
        values: fields,
        count: fields.length
      }
    });
  } catch (error) {
    devError('request logs meta index error:', error.message);
    return res.status(500).json({
      error: 'Failed to retrieve request log columns'
    });
  }
};

export const show = async (req, res) => {
  try {
    const RequestLog = sequelize.models.RequestLog;
    const fields = Object.keys(RequestLog.getAttributes());
    const field = req.params.field;

    if (!fields.includes(field)) {
      return res.status(400).json({
        error: `Invalid request log field '${field}'. Use /v1/logs/meta to list supported fields.`
      });
    }

    const result = await distinct(RequestLog, field);

    return res.status(200).json({
      data: result
    });
  } catch (error) {
    devError('request logs meta show error:', error.message);
    return res.status(500).json({
      error: 'Failed to retrieve request log field values'
    });
  }
};
