/**
 * Sequelize/Umzug migration: rename logs table to request_logs
 */

export async function up({context: queryInterface}) {
  await queryInterface.renameTable('logs', 'request_logs');
  await queryInterface.removeIndex('request_logs', 'idx_logs_ip');
  await queryInterface.addIndex('request_logs', ['ip'], { name: 'idx_request_logs_ip' });
}

export async function down({context: queryInterface}) {
  await queryInterface.removeIndex('request_logs', 'idx_request_logs_ip');
  await queryInterface.addIndex('request_logs', ['ip'], { name: 'idx_logs_ip' });
  await queryInterface.renameTable('request_logs', 'logs');
}
