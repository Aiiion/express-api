/**
 * Sequelize/Umzug seeder: seed logs table with sample data
 */

export async function up({context: queryInterface}) {
  const logs = [
    { ip: '192.168.1.10', method: 'GET', route: '/api/users', code: 200, description: 'Fetched users successfully', type: 'INFO', created_at: new Date('2024-01-15T10:30:00Z') },
    { ip: '192.168.1.11', method: 'POST', route: '/api/users', code: 201, description: 'User created', type: 'INFO', created_at: new Date('2024-01-15T11:00:00Z') },
    { ip: '192.168.1.12', method: 'GET', route: '/api/products', code: 200, description: 'Products retrieved', type: 'INFO', created_at: new Date('2024-01-15T11:15:00Z') },
    { ip: '192.168.1.13', method: 'PUT', route: '/api/users/123', code: 200, description: 'User updated', type: 'INFO', created_at: new Date('2024-01-15T11:30:00Z') },
    { ip: '192.168.1.14', method: 'DELETE', route: '/api/users/456', code: 204, description: 'User deleted', type: 'INFO', created_at: new Date('2024-01-15T12:00:00Z') },
    { ip: '192.168.1.15', method: 'GET', route: '/api/orders', code: 404, description: 'Orders not found', type: 'WARN', created_at: new Date('2024-01-15T12:15:00Z') },
    { ip: '192.168.1.16', method: 'POST', route: '/api/login', code: 401, description: 'Unauthorized access attempt', type: 'WARN', created_at: new Date('2024-01-15T12:30:00Z') },
    { ip: '192.168.1.17', method: 'GET', route: '/api/dashboard', code: 500, description: 'Internal server error', type: 'ERROR', created_at: new Date('2024-01-15T13:00:00Z') },
    { ip: '192.168.1.18', method: 'PATCH', route: '/api/settings', code: 200, description: 'Settings updated', type: 'INFO', created_at: new Date('2024-01-15T13:15:00Z') },
    { ip: '192.168.1.19', method: 'GET', route: '/api/stats', code: 200, description: 'Statistics retrieved', type: 'DEBUG', created_at: new Date('2024-01-15T13:30:00Z') },
    { ip: '10.0.0.100', method: 'POST', route: '/api/upload', code: 413, description: 'Payload too large', type: 'WARN', created_at: new Date('2024-01-15T14:00:00Z') },
    { ip: '10.0.0.101', method: 'GET', route: '/api/health', code: 200, description: 'Health check passed', type: 'DEBUG', created_at: new Date('2024-01-15T14:15:00Z') },
    { ip: '10.0.0.102', method: 'OPTIONS', route: '/api/users', code: 204, description: 'CORS preflight', type: 'DEBUG', created_at: new Date('2024-01-15T14:30:00Z') },
    { ip: '10.0.0.103', method: 'HEAD', route: '/api/status', code: 200, description: 'Status check', type: 'DEBUG', created_at: new Date('2024-01-15T14:45:00Z') },
    { ip: '10.0.0.104', method: 'GET', route: '/api/reports', code: 403, description: 'Forbidden access', type: 'WARN', created_at: new Date('2024-01-15T15:00:00Z') },
    { ip: '10.0.0.105', method: 'POST', route: '/api/webhook', code: 200, description: 'Webhook processed', type: 'INFO', created_at: new Date('2024-01-15T15:15:00Z') },
    { ip: '172.16.0.50', method: 'GET', route: '/api/logs', code: 200, description: 'Logs fetched', type: 'INFO', created_at: new Date('2024-01-15T15:30:00Z') },
    { ip: '172.16.0.51', method: 'DELETE', route: '/api/cache', code: 200, description: 'Cache cleared', type: 'INFO', created_at: new Date('2024-01-15T15:45:00Z') },
    { ip: '172.16.0.52', method: 'PUT', route: '/api/config', code: 500, description: 'Configuration update failed', type: 'ERROR', created_at: new Date('2024-01-15T16:00:00Z') },
    { ip: '172.16.0.53', method: 'GET', route: '/api/metrics', code: 200, description: 'Metrics retrieved', type: 'INFO', created_at: new Date('2024-01-15T16:15:00Z') }
  ];

  await queryInterface.bulkInsert('logs', logs);
}

export async function down({context: queryInterface}) {
  await queryInterface.bulkDelete('logs', null, {});
}
