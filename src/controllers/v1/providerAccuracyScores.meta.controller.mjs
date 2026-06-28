import { distinct } from '../../services/meta.service.mjs';
import { sequelize } from '../../models/index.mjs';

export const index = async (req, res) => {
  const ProviderAccuracyScore = sequelize.models.ProviderAccuracyScore;
  const fields = Object.keys(ProviderAccuracyScore.getAttributes());

  return res.status(200).json({
    data: {
      resource: 'ProviderAccuracyScore',
      values: fields,
      count: fields.length,
    },
  });
};

export const show = async (req, res) => {
  const ProviderAccuracyScore = sequelize.models.ProviderAccuracyScore;
  const field = req.params.field;
  const result = await distinct(ProviderAccuracyScore, field);

  return res.status(200).json({ data: result });
};
