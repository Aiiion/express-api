/**
 * Sequelize/Umzug migration: create error_logs table
 */
import { Sequelize } from 'sequelize';

export async function up({context: queryInterface}) {
  await queryInterface.createTable('error_logs', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    level: { type: Sequelize.ENUM('DEBUG','INFO','WARN','ERROR','FATAL'), allowNull: false, defaultValue: 'ERROR' },
    message: { type: Sequelize.TEXT, allowNull: false },
    stack_trace: { type: Sequelize.TEXT, allowNull: true },
    route: { type: Sequelize.TEXT, allowNull: true },
    environment: { type: Sequelize.TEXT, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') }
  });
}

export async function down({context: queryInterface}) {
  await queryInterface.dropTable('error_logs');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_error_logs_level"');
}
