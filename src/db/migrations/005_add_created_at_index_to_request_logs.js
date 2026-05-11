/**
 * Sequelize/Umzug migration: add created_at index to request_logs table
 */

export async function up({context: queryInterface}) {
  await queryInterface.addIndex('request_logs', ['created_at'], { name: 'request_logs_created_at_idx' });
}

export async function down({context: queryInterface}) {
  await queryInterface.removeIndex('request_logs', 'request_logs_created_at_idx');
}
