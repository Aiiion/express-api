import { sequelize } from '../models/index.mjs';
import { extractIp } from '../utils/ipHelpers.mjs';

// Express middleware to create a log row after response finishes.
export const logRequest = () => {

  return (req, res, next) => {
    res.on('finish', async () => {
      const Log = sequelize.models.Log;
      if (!Log) return;

    const data = {
      ip: extractIp(req) || null,
      route: req.originalUrl || req.url || null,
      method: req.method,
      code: res.statusCode,
      description: null,
      type: 'INFO',
    };
    
    try {
      await Log.create(data);
      } catch (err) {
        // don't crash the app for logging failures
        console.error('Failed to create log entry:', err);
      }
    });

    return next();
  };
};