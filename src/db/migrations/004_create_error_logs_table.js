/**
 * Sequelize/Umzug migration: create error_logs table
 */
import { Sequelize } from 'sequelize';

export async function up({context: queryInterface}) {
  await queryInterface.createTable('error_logs', {
    id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    message: { type: Sequelize.TEXT, allowNull: false },
    stack_trace: { type: Sequelize.TEXT, allowNull: true },
    route: { type: Sequelize.TEXT, allowNull: true },
    environment: { type: Sequelize.TEXT, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('now') }
  });

  await queryInterface.addIndex('error_logs', ['created_at'], { name: 'error_logs_created_at_idx' });
}

export async function down({context: queryInterface}) {
  await queryInterface.removeIndex('error_logs', 'error_logs_created_at_idx');
  await queryInterface.dropTable('error_logs');
}
