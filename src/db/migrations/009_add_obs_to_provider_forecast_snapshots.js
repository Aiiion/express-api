import { Sequelize } from 'sequelize';

export async function up({ context: queryInterface }) {
  const t = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.addColumn('provider_forecast_snapshots', 'obs_avg_temp',       { type: Sequelize.REAL, allowNull: true }, { transaction: t });
    await queryInterface.addColumn('provider_forecast_snapshots', 'obs_total_precip',   { type: Sequelize.REAL, allowNull: true }, { transaction: t });
    await queryInterface.addColumn('provider_forecast_snapshots', 'obs_avg_wind_speed', { type: Sequelize.REAL, allowNull: true }, { transaction: t });
    await queryInterface.addColumn('provider_forecast_snapshots', 'obs_avg_humidity',   { type: Sequelize.REAL, allowNull: true }, { transaction: t });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

export async function down({ context: queryInterface }) {
  const t = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.removeColumn('provider_forecast_snapshots', 'obs_avg_temp',       { transaction: t });
    await queryInterface.removeColumn('provider_forecast_snapshots', 'obs_total_precip',   { transaction: t });
    await queryInterface.removeColumn('provider_forecast_snapshots', 'obs_avg_wind_speed', { transaction: t });
    await queryInterface.removeColumn('provider_forecast_snapshots', 'obs_avg_humidity',   { transaction: t });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
}
