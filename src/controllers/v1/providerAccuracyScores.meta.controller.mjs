import { distinct } from '../../services/meta.service.mjs';
import { sequelize } from '../../models/index.mjs';
import { devError } from '../../utils/logger.mjs';

export const index = async (req, res) => {
  try {
    const ProviderAccuracyScore = sequelize.models.ProviderAccuracyScore;
    const fields = Object.keys(ProviderAccuracyScore.getAttributes());

    return res.status(200).json({
      data: {
        resource: 'ProviderAccuracyScore',
        values: fields,
        count: fields.length,
      },
    });
  } catch (error) {
    devError('provider accuracy scores meta index error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve provider accuracy score columns' });
  }
};

export const show = async (req, res) => {
  try {
    const ProviderAccuracyScore = sequelize.models.ProviderAccuracyScore;
    const field = req.params.field;
    const result = await distinct(ProviderAccuracyScore, field);

    return res.status(200).json({ data: result });
  } catch (error) {
    devError('provider accuracy scores meta show error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve provider accuracy score field values' });
  }
};
