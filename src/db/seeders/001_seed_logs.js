/**
 * Sequelize/Umzug seeder: seed logs table with sample data
 */

export async function up({context: queryInterface}) {
  const logs = [
    { ip: '203.0.113.10', method: 'GET', route: '/', code: 200, description: 'Contact endpoint accessed', type: 'INFO', created_at: new Date('2024-01-15T10:30:00Z') },
    { ip: '198.51.100.25', method: 'GET', route: '/cv', code: 200, description: 'CV endpoint accessed', type: 'INFO', created_at: new Date('2024-01-15T11:00:00Z') },
    { ip: '203.0.113.42', method: 'GET', route: '/test', code: 200, description: 'Test endpoint accessed', type: 'INFO', created_at: new Date('2024-01-15T11:15:00Z') },
    { ip: '198.51.100.88', method: 'GET', route: '/ip-location', code: 200, description: 'IP location retrieved', type: 'INFO', created_at: new Date('2024-01-15T11:30:00Z') },
    { ip: '203.0.113.67', method: 'GET', route: '/weather', code: 200, description: 'Weather data retrieved', type: 'INFO', created_at: new Date('2024-01-15T12:00:00Z') },
    { ip: '198.51.100.123', method: 'GET', route: '/weather/pollution', code: 200, description: 'Pollution data retrieved', type: 'INFO', created_at: new Date('2024-01-15T12:15:00Z') },
    { ip: '203.0.113.99', method: 'GET', route: '/weather/aggregate', code: 200, description: 'Aggregate weather data retrieved', type: 'INFO', created_at: new Date('2024-01-15T12:30:00Z') },
    { ip: '198.51.100.156', method: 'GET', route: '/', code: 200, description: 'Contact endpoint accessed', type: 'DEBUG', created_at: new Date('2024-01-15T13:00:00Z') },
    { ip: '203.0.113.145', method: 'GET', route: '/cv', code: 200, description: 'CV endpoint accessed', type: 'INFO', created_at: new Date('2024-01-15T13:15:00Z') },
    { ip: '198.51.100.201', method: 'GET', route: '/test', code: 200, description: 'Test endpoint accessed', type: 'DEBUG', created_at: new Date('2024-01-15T13:30:00Z') },
    { ip: '203.0.113.178', method: 'GET', route: '/weather', code: 400, description: 'Invalid request parameters', type: 'WARN', created_at: new Date('2024-01-15T14:00:00Z') },
    { ip: '198.51.100.234', method: 'GET', route: '/weather/pollution', code: 200, description: 'Pollution data retrieved', type: 'INFO', created_at: new Date('2024-01-15T14:15:00Z') },
    { ip: '203.0.113.211', method: 'GET', route: '/weather/aggregate', code: 200, description: 'Aggregate data retrieved', type: 'INFO', created_at: new Date('2024-01-15T14:30:00Z') },
    { ip: '198.51.100.77', method: 'GET', route: '/ip-location', code: 403, description: 'Missing API key', type: 'WARN', created_at: new Date('2024-01-15T14:45:00Z') },
    { ip: '203.0.113.5', method: 'GET', route: '/', code: 200, description: 'Contact endpoint accessed', type: 'INFO', created_at: new Date('2024-01-15T15:00:00Z') },
    { ip: '198.51.100.44', method: 'GET', route: '/weather', code: 500, description: 'Internal server error', type: 'ERROR', created_at: new Date('2024-01-15T15:15:00Z') },
    { ip: '203.0.113.188', method: 'GET', route: '/cv', code: 200, description: 'CV endpoint accessed', type: 'INFO', created_at: new Date('2024-01-15T15:30:00Z') },
    { ip: '198.51.100.167', method: 'GET', route: '/test', code: 200, description: 'Test endpoint accessed', type: 'INFO', created_at: new Date('2024-01-15T15:45:00Z') },
    { ip: '203.0.113.222', method: 'GET', route: '/weather/pollution', code: 200, description: 'Pollution data retrieved', type: 'INFO', created_at: new Date('2024-01-15T16:00:00Z') },
    { ip: '198.51.100.98', method: 'GET', route: '/weather/aggregate', code: 200, description: 'Aggregate data retrieved', type: 'INFO', created_at: new Date('2024-01-15T16:15:00Z') }
  ];

  await queryInterface.bulkInsert('logs', logs);
}

export async function down({context: queryInterface}) {
  await queryInterface.bulkDelete('logs', null, {});
}
