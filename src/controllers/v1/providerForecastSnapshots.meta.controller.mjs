import { sequelize } from '../../models/index.mjs';
import { distinct } from '../../services/meta.service.mjs';

export const index = async (_req, res) => {
  const ProviderForecastSnapshot = sequelize.models.ProviderForecastSnapshot;
  const fields = Object.keys(ProviderForecastSnapshot.getAttributes());

  return res.status(200).json({
    data: {
      resource: 'ProviderForecastSnapshot',
      values: fields,
      count: fields.length,
    },
  });
};

export const show = async (req, res) => {
  const ProviderForecastSnapshot = sequelize.models.ProviderForecastSnapshot;
  const field = req.params.field;
  const result = await distinct(ProviderForecastSnapshot, field);

  return res.status(200).json({ data: result });
};
