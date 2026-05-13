/**
 * Sequelize/Umzug migration: add stable_id to request_logs for idempotent flush
 */
import { Sequelize } from 'sequelize';

export async function up({ context: queryInterface }) {
  await queryInterface.addColumn('request_logs', 'stable_id', {
    type: Sequelize.UUID,
    allowNull: true,
    unique: true,
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeColumn('request_logs', 'stable_id');
}
