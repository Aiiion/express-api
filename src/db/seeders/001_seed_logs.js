/**
 * Sequelize/Umzug seeder: seed logs table with sample data
 */

import { Op } from 'sequelize';

export async function up({context: queryInterface}) {
  const logs = [
    { ip: '203.0.113.10', method: 'GET', route: '/', code: 200, description: 'Contact endpoint accessed', type: 'INFO', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', created_at: new Date('2001-01-15T10:30:00Z') },
    { ip: '198.51.100.25', method: 'GET', route: '/cv', code: 200, description: 'CV endpoint accessed', type: 'INFO', user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15', created_at: new Date('2001-01-15T11:00:00Z') },
    { ip: '203.0.113.42', method: 'GET', route: '/test', code: 200, description: 'Test endpoint accessed', type: 'INFO', user_agent: 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0', created_at: new Date('2001-01-15T11:15:00Z') },
    { ip: '198.51.100.88', method: 'GET', route: '/ip-location', code: 200, description: 'IP location retrieved', type: 'INFO', user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1', created_at: new Date('2001-01-15T11:30:00Z') },
    { ip: '203.0.113.67', method: 'GET', route: '/weather', code: 200, description: 'Weather data retrieved', type: 'INFO', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', created_at: new Date('2001-01-15T12:00:00Z') },
    { ip: '198.51.100.123', method: 'GET', route: '/weather/pollution', code: 200, description: 'Pollution data retrieved', type: 'INFO', user_agent: 'curl/8.4.0', created_at: new Date('2001-01-15T12:15:00Z') },
    { ip: '203.0.113.99', method: 'GET', route: '/weather/aggregate', code: 200, description: 'Aggregate weather data retrieved', type: 'INFO', user_agent: 'Mozilla/5.0 (Android 14; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0', created_at: new Date('2001-01-15T12:30:00Z') },
    { ip: '198.51.100.156', method: 'GET', route: '/', code: 200, description: 'Contact endpoint accessed', type: 'DEBUG', user_agent: null, created_at: new Date('2001-01-15T13:00:00Z') },
    { ip: '203.0.113.145', method: 'GET', route: '/cv', code: 200, description: 'CV endpoint accessed', type: 'INFO', user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', created_at: new Date('2001-01-15T13:15:00Z') },
    { ip: '198.51.100.201', method: 'GET', route: '/test', code: 200, description: 'Test endpoint accessed', type: 'DEBUG', user_agent: 'PostmanRuntime/7.36.0', created_at: new Date('2001-01-15T13:30:00Z') },
    { ip: '203.0.113.178', method: 'GET', route: '/weather', code: 400, description: 'Invalid request parameters', type: 'WARN', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', created_at: new Date('2001-01-15T14:00:00Z') },
    { ip: '198.51.100.234', method: 'GET', route: '/weather/pollution', code: 200, description: 'Pollution data retrieved', type: 'INFO', user_agent: 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0', created_at: new Date('2001-01-15T14:15:00Z') },
    { ip: '203.0.113.211', method: 'GET', route: '/weather/aggregate', code: 200, description: 'Aggregate data retrieved', type: 'INFO', user_agent: 'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1', created_at: new Date('2001-01-15T14:30:00Z') },
    { ip: '198.51.100.77', method: 'GET', route: '/ip-location', code: 403, description: 'Missing API key', type: 'WARN', user_agent: 'curl/8.4.0', created_at: new Date('2001-01-15T14:45:00Z') },
    { ip: '203.0.113.5', method: 'GET', route: '/', code: 200, description: 'Contact endpoint accessed', type: 'INFO', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', created_at: new Date('2001-01-15T15:00:00Z') },
    { ip: '198.51.100.44', method: 'GET', route: '/weather', code: 500, description: 'Internal server error', type: 'ERROR', user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15', created_at: new Date('2001-01-15T15:15:00Z') },
    { ip: '203.0.113.188', method: 'GET', route: '/cv', code: 200, description: 'CV endpoint accessed', type: 'INFO', user_agent: 'Mozilla/5.0 (Android 14; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0', created_at: new Date('2001-01-15T15:30:00Z') },
    { ip: '198.51.100.167', method: 'GET', route: '/test', code: 200, description: 'Test endpoint accessed', type: 'INFO', user_agent: 'PostmanRuntime/7.36.0', created_at: new Date('2001-01-15T15:45:00Z') },
    { ip: '203.0.113.222', method: 'GET', route: '/weather/pollution', code: 200, description: 'Pollution data retrieved', type: 'INFO', user_agent: null, created_at: new Date('2001-01-15T16:00:00Z') },
    { ip: '198.51.100.98', method: 'GET', route: '/weather/aggregate', code: 200, description: 'Aggregate data retrieved', type: 'INFO', user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', created_at: new Date('2001-01-15T16:15:00Z') }
  ];

  await queryInterface.bulkInsert('logs', logs);
}

export async function down({context: queryInterface}) {
  const start = new Date('2001-01-01T00:00:00Z');
  const end = new Date('2001-12-31T23:59:59.999Z');
  await queryInterface.bulkDelete('logs', { created_at: { [Op.between]: [start, end] } });
}
