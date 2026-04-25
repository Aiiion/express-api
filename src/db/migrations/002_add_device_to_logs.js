/**
 * Sequelize/Umzug migration: add user_agent column to logs table
 */
import { Sequelize } from 'sequelize';

export async function up({context: queryInterface}) {
  await queryInterface.addColumn('logs', 'user_agent', {
    type: Sequelize.STRING,
    allowNull: true,
  });
}

export async function down({context: queryInterface}) {
  await queryInterface.removeColumn('logs', 'user_agent');
}
