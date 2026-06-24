import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ProviderAccuracyScore = sequelize.define('ProviderAccuracyScore', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    provider: { type: DataTypes.STRING(50), allowNull: false },
    country_code: { type: DataTypes.CHAR(2), allowNull: false, defaultValue: 'GL' },
    temp_mae: { type: DataTypes.REAL, allowNull: true },
    precip_mae: { type: DataTypes.REAL, allowNull: true },
    wind_mae: { type: DataTypes.REAL, allowNull: true },
    humidity_mae: { type: DataTypes.REAL, allowNull: true },
    sample_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    computed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'provider_accuracy_scores',
    timestamps: false,
  });

  return ProviderAccuracyScore;
};
