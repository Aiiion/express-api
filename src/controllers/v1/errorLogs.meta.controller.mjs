import { distinct } from '../../services/meta.service.mjs';
import { sequelize } from '../../models/index.mjs';
import { devError } from '../../utils/logger.mjs';

export const index = async (req, res) => {
  try {
    const ErrorLog = sequelize.models.ErrorLog;
    const fields = Object.keys(ErrorLog.getAttributes());

    return res.status(200).json({
      data: {
        resource: 'ErrorLog',
        values: fields,
        count: fields.length
      }
    });
  } catch (error) {
    devError('error logs meta index error:', error.message);
    return res.status(500).json({
      error: 'Failed to retrieve error log columns'
    });
  }
};

export const show = async (req, res) => {
  try {
    const ErrorLog = sequelize.models.ErrorLog;
    const fields = Object.keys(ErrorLog.getAttributes());
    const field = req.params.field;

    if (!fields.includes(field)) {
      return res.status(400).json({
        error: `Invalid error log field '${field}'. Use /v1/errorLogs/meta to list supported fields.`
      });
    }

    const result = await distinct(ErrorLog, field);

    return res.status(200).json({
      data: result
    });
  } catch (error) {
    devError('error logs meta show error:', error.message);
    return res.status(500).json({
      error: 'Failed to retrieve error log field values'
    });
  }
};
