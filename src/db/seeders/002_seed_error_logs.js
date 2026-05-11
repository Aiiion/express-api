/**
 * Sequelize/Umzug seeder: seed error_logs table with sample data
 */

import { Op } from 'sequelize';

export async function up({context: queryInterface}) {
  const errorLogs = [
    { message: 'Cannot read properties of undefined (reading \'lat\')', stack_trace: 'TypeError: Cannot read properties of undefined (reading \'lat\')\n    at getWeather (/app/src/controllers/weather.controller.mjs:12:34)\n    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)', route: '/weather', environment: 'production', created_at: new Date('2001-01-15T10:45:00Z') },
    { message: 'ECONNREFUSED connect ECONNREFUSED 127.0.0.1:5432', stack_trace: 'Error: connect ECONNREFUSED 127.0.0.1:5432\n    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1278:16)', route: null, environment: 'production', created_at: new Date('2001-01-15T11:20:00Z') },
    { message: 'Validation error: lat must be a number', stack_trace: 'ValidationError: lat must be a number\n    at validateRequest (/app/src/middleware/validation.middleware.mjs:25:11)\n    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)', route: '/weather', environment: 'production', created_at: new Date('2001-01-15T12:10:00Z') },
    { message: 'Upstream API request failed with status 503', stack_trace: 'Error: Upstream API request failed with status 503\n    at fetchWeatherData (/app/src/services/openWeatherMaps.service.mjs:48:13)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)', route: '/weather/aggregate', environment: 'production', created_at: new Date('2001-01-15T13:05:00Z') },
    { message: 'JWT malformed', stack_trace: 'JsonWebTokenError: jwt malformed\n    at /app/node_modules/jsonwebtoken/verify.js:63:16\n    at getSecret (/app/node_modules/jsonwebtoken/verify.js:90:14)', route: '/v1/request-logs', environment: 'production', created_at: new Date('2001-01-15T14:30:00Z') },
    { message: 'Cannot read properties of null (reading \'id\')', stack_trace: 'TypeError: Cannot read properties of null (reading \'id\')\n    at authController (/app/src/controllers/v1/auth.controller.mjs:33:18)\n    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)', route: '/v1/auth/login', environment: 'production', created_at: new Date('2001-01-15T15:10:00Z') },
    { message: 'SMTP connection timeout', stack_trace: 'Error: SMTP connection timeout\n    at SMTPConnection._formatError (/app/node_modules/nodemailer/lib/smtp-connection/index.js:791:19)\n    at SMTPConnection._onTimeout (/app/node_modules/nodemailer/lib/smtp-connection/index.js:588:26)', route: null, environment: 'production', created_at: new Date('2001-01-15T16:00:00Z') },
    { message: 'SequelizeUniqueConstraintError: Validation error', stack_trace: 'SequelizeUniqueConstraintError: Validation error\n    at Query.formatError (/app/node_modules/sequelize/lib/dialects/postgres/query.js:418:16)\n    at Query.run (/app/node_modules/sequelize/lib/dialects/postgres/query.js:122:18)', route: '/v1/auth/register', environment: 'production', created_at: new Date('2001-01-15T16:45:00Z') },
  ];

  await queryInterface.bulkInsert('error_logs', errorLogs);
}

export async function down({context: queryInterface}) {
  const start = new Date('2001-01-01T00:00:00Z');
  const end = new Date('2001-12-31T23:59:59.999Z');
  await queryInterface.bulkDelete('error_logs', { created_at: { [Op.between]: [start, end] } });
}
