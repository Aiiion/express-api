import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const ProviderForecastSnapshot = sequelize.define('ProviderForecastSnapshot', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    provider: { type: DataTypes.STRING(50), allowNull: false },
    lat: { type: DataTypes.DECIMAL(8, 5), allowNull: false },
    lon: { type: DataTypes.DECIMAL(8, 5), allowNull: false },
    country_code: { type: DataTypes.CHAR(2), allowNull: false, defaultValue: 'GL' },
    valid_for: { type: DataTypes.DATEONLY, allowNull: false },
    forecasted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    avg_temp: { type: DataTypes.REAL, allowNull: true },
    total_precip: { type: DataTypes.REAL, allowNull: true },
    avg_wind_speed: { type: DataTypes.REAL, allowNull: true },
    avg_humidity: { type: DataTypes.REAL, allowNull: true },
    avg_pressure: { type: DataTypes.REAL, allowNull: true },
    evaluated: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, {
    tableName: 'provider_forecast_snapshots',
    timestamps: false,
  });

  return ProviderForecastSnapshot;
};
