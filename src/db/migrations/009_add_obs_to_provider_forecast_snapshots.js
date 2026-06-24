import { Sequelize } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.addColumn('provider_forecast_snapshots', 'obs_avg_temp',      { type: Sequelize.REAL, allowNull: true });
  await queryInterface.addColumn('provider_forecast_snapshots', 'obs_total_precip',  { type: Sequelize.REAL, allowNull: true });
  await queryInterface.addColumn('provider_forecast_snapshots', 'obs_avg_wind_speed',{ type: Sequelize.REAL, allowNull: true });
  await queryInterface.addColumn('provider_forecast_snapshots', 'obs_avg_humidity',  { type: Sequelize.REAL, allowNull: true });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeColumn('provider_forecast_snapshots', 'obs_avg_temp');
  await queryInterface.removeColumn('provider_forecast_snapshots', 'obs_total_precip');
  await queryInterface.removeColumn('provider_forecast_snapshots', 'obs_avg_wind_speed');
  await queryInterface.removeColumn('provider_forecast_snapshots', 'obs_avg_humidity');
}
