import { distinct } from '../../services/meta.service.mjs';
import { sequelize } from '../../models/index.mjs';

export const index = async (req, res) => {
  try {
    const Log = sequelize.models.Log;
    const fields = Object.keys(Log.getAttributes());

    return res.status(200).json({
      data: {
        resource: 'Log',
        values: fields,
        count: fields.length
      }
    });
  } catch (error) {
    console.error('logs meta index error:', error.message);
    return res.status(500).json({
      error: 'Failed to retrieve log columns'
    });
  }
};

export const show = async (req, res) => {
  try {
    const Log = sequelize.models.Log;
    const field = req.params.field;
    const result = await distinct(Log, field);

    return res.status(200).json({
      data: result
    });
  } catch (error) {
    console.error('logs meta show error:', error.message);
    return res.status(500).json({
      error: 'Failed to retrieve log field values'
    });
  }
};