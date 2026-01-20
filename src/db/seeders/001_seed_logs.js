/**
 * Sequelize/Umzug seeder: seed logs table with sample data
 */

export async function up({context: queryInterface}) {
  const logs = [
    { ip: '192.168.1.10', method: 'GET', route: '/', code: 200, description: 'Contact endpoint accessed', type: 'INFO', created_at: new Date('2024-01-15T10:30:00Z') },
    { ip: '192.168.1.11', method: 'GET', route: '/cv', code: 200, description: 'CV endpoint accessed', type: 'INFO', created_at: new Date('2024-01-15T11:00:00Z') },
    { ip: '192.168.1.12', method: 'GET', route: '/test', code: 200, description: 'Test endpoint accessed', type: 'INFO', created_at: new Date('2024-01-15T11:15:00Z') },
    { ip: '192.168.1.13', method: 'GET', route: '/ip-location', code: 200, description: 'IP location retrieved', type: 'INFO', created_at: new Date('2024-01-15T11:30:00Z') },
    { ip: '192.168.1.14', method: 'GET', route: '/weather', code: 200, description: 'Weather data retrieved', type: 'INFO', created_at: new Date('2024-01-15T12:00:00Z') },
    { ip: '192.168.1.15', method: 'GET', route: '/weather/pollution', code: 200, description: 'Pollution data retrieved', type: 'INFO', created_at: new Date('2024-01-15T12:15:00Z') },
    { ip: '192.168.1.16', method: 'GET', route: '/weather/aggregate', code: 200, description: 'Aggregate weather data retrieved', type: 'INFO', created_at: new Date('2024-01-15T12:30:00Z') },
    { ip: '192.168.1.17', method: 'GET', route: '/', code: 200, description: 'Contact endpoint accessed', type: 'DEBUG', created_at: new Date('2024-01-15T13:00:00Z') },
    { ip: '192.168.1.18', method: 'GET', route: '/cv', code: 200, description: 'CV endpoint accessed', type: 'INFO', created_at: new Date('2024-01-15T13:15:00Z') },
    { ip: '192.168.1.19', method: 'GET', route: '/test', code: 200, description: 'Test endpoint accessed', type: 'DEBUG', created_at: new Date('2024-01-15T13:30:00Z') },
    { ip: '10.0.0.100', method: 'GET', route: '/weather', code: 400, description: 'Invalid request parameters', type: 'WARN', created_at: new Date('2024-01-15T14:00:00Z') },
    { ip: '10.0.0.101', method: 'GET', route: '/weather/pollution', code: 200, description: 'Pollution data retrieved', type: 'INFO', created_at: new Date('2024-01-15T14:15:00Z') },
    { ip: '10.0.0.102', method: 'GET', route: '/weather/aggregate', code: 200, description: 'Aggregate data retrieved', type: 'INFO', created_at: new Date('2024-01-15T14:30:00Z') },
    { ip: '10.0.0.103', method: 'GET', route: '/ip-location', code: 403, description: 'Missing API key', type: 'WARN', created_at: new Date('2024-01-15T14:45:00Z') },
    { ip: '10.0.0.104', method: 'GET', route: '/', code: 200, description: 'Contact endpoint accessed', type: 'INFO', created_at: new Date('2024-01-15T15:00:00Z') },
    { ip: '10.0.0.105', method: 'GET', route: '/weather', code: 500, description: 'Internal server error', type: 'ERROR', created_at: new Date('2024-01-15T15:15:00Z') },
    { ip: '172.16.0.50', method: 'GET', route: '/cv', code: 200, description: 'CV endpoint accessed', type: 'INFO', created_at: new Date('2024-01-15T15:30:00Z') },
    { ip: '172.16.0.51', method: 'GET', route: '/test', code: 200, description: 'Test endpoint accessed', type: 'INFO', created_at: new Date('2024-01-15T15:45:00Z') },
    { ip: '172.16.0.52', method: 'GET', route: '/weather/pollution', code: 200, description: 'Pollution data retrieved', type: 'INFO', created_at: new Date('2024-01-15T16:00:00Z') },
    { ip: '172.16.0.53', method: 'GET', route: '/weather/aggregate', code: 200, description: 'Aggregate data retrieved', type: 'INFO', created_at: new Date('2024-01-15T16:15:00Z') }
  ];

  await queryInterface.bulkInsert('logs', logs);
}

export async function down({context: queryInterface}) {
  await queryInterface.bulkDelete('logs', null, {});
}
