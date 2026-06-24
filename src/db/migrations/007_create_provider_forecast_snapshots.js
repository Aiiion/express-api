import { Sequelize } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.createTable('provider_forecast_snapshots', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    provider: {
      type: Sequelize.STRING(50),
      allowNull: false,
    },
    lat: {
      type: Sequelize.DECIMAL(8, 5),
      allowNull: false,
    },
    lon: {
      type: Sequelize.DECIMAL(8, 5),
      allowNull: false,
    },
    country_code: {
      type: Sequelize.CHAR(2),
      allowNull: false,
      defaultValue: 'GL',
    },
    valid_for: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    forecasted_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    avg_temp: { type: Sequelize.REAL, allowNull: true },
    total_precip: { type: Sequelize.REAL, allowNull: true },
    avg_wind_speed: { type: Sequelize.REAL, allowNull: true },
    avg_humidity: { type: Sequelize.REAL, allowNull: true },
    avg_pressure: { type: Sequelize.REAL, allowNull: true },
    evaluated: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  });

  await queryInterface.addIndex('provider_forecast_snapshots', ['valid_for', 'evaluated'], {
    name: 'idx_pfs_valid_for_evaluated',
  });
  await queryInterface.addIndex('provider_forecast_snapshots', ['provider', 'country_code'], {
    name: 'idx_pfs_provider_country',
  });
  await queryInterface.addConstraint('provider_forecast_snapshots', {
    fields: ['provider', 'lat', 'lon', 'valid_for'],
    type: 'unique',
    name: 'uq_pfs_provider_lat_lon_date',
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable('provider_forecast_snapshots');
}
