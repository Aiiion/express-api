import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { sendRedisCommand } from '../services/infrastructure/redis.service.mjs';

// Per-IP limiter backed by Redis so counts survive restarts and are shared
// across instances; in-memory when NODE_ENV=test. `prefix` is required and must
// be unique per limiter — rate-limit-redis defaults every store to `rl:`, so
// two limiters without their own prefix would share one counter.
export const createRateLimiter = ({ windowMs, max, prefix, message }) => {
  if (!prefix) throw new Error('createRateLimiter requires a unique prefix');

  const options = {
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message,
  };

  if (process.env.NODE_ENV !== 'test') {
    options.store = new RedisStore({ sendCommand: sendRedisCommand, prefix });
  }

  return rateLimit(options);
};
