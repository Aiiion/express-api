import dotenv from 'dotenv';
import { createClient } from 'redis';
import { devError } from '../utils/logger.mjs';

dotenv.config();

const REQUEST_LOGS_QUEUE_KEY = 'request_logs';
const REQUEST_LOGS_PROCESSING_KEY = 'request_logs:processing';
const REQUEST_LOGS_FLUSH_LOCK_KEY = 'request_logs:flush_lock';

let redisClient;
let redisClientPromise;

const getRedisUrl = () => process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;

const getClient = async () => {
  if (redisClient?.isOpen) return redisClient;

  if (!redisClientPromise) {
    redisClient = createClient({ url: getRedisUrl() });
    redisClient.on('error', (err) => devError('Redis error:', err));
    redisClientPromise = redisClient.connect()
      .then(() => redisClient)
      .catch((err) => {
        redisClientPromise = undefined;
        redisClient = undefined;
        throw err;
      });
  }

  return redisClientPromise;
};

export const ensureRedisConnection = async () => {
  await getClient();
};

export const closeRedisConnection = async () => {
  if (redisClient?.isOpen) await redisClient.quit();
  redisClient = undefined;
  redisClientPromise = undefined;
};

export const setJsonValue = async (key, value, ttlSeconds) => {
  const serializedValue = JSON.stringify(value);
  const client = await getClient();
  if (ttlSeconds) {
    await client.set(key, serializedValue, { EX: ttlSeconds });
    return;
  }
  await client.set(key, serializedValue);
};

export const getJsonValue = async (key) => {
  const client = await getClient();
  const serializedValue = await client.get(key);
  if (!serializedValue) return null;
  try {
    return JSON.parse(serializedValue);
  } catch {
    await client.del(key);
    return null;
  }
};

export const deleteValue = async (key) => {
  const client = await getClient();
  await client.del(key);
};

export const enqueueRequestLog = async (payload) => {
  const client = await getClient();
  await client.lPush(REQUEST_LOGS_QUEUE_KEY, JSON.stringify(payload));
};

export const getRequestLogQueueLength = async () => {
  const client = await getClient();
  return client.lLen(REQUEST_LOGS_QUEUE_KEY);
};

export const getRequestLogProcessingLength = async () => {
  const client = await getClient();
  return client.lLen(REQUEST_LOGS_PROCESSING_KEY);
};

export const moveRequestLogsToProcessing = async (count) => {
  if (!count || count < 1) return 0;

  const client = await getClient();
  let moved = 0;

  while (moved < count) {
    const entry = await client.sendCommand(['RPOPLPUSH', REQUEST_LOGS_QUEUE_KEY, REQUEST_LOGS_PROCESSING_KEY]);
    if (!entry) break;
    moved += 1;
  }

  return moved;
};

export const getProcessingRequestLogs = async () => {
  const client = await getClient();
  return client.lRange(REQUEST_LOGS_PROCESSING_KEY, 0, -1);
};

export const getQueuedRequestLogs = async () => {
  const client = await getClient();
  return client.lRange(REQUEST_LOGS_QUEUE_KEY, 0, -1);
};

/**
 * Returns the oldest (tail) entry in the request-log queue without removing it,
 * or null when the queue is empty.  The queue is a Redis list where new items are
 * pushed to the head (lPush/unshift), so the tail (index -1) is always the oldest.
 */
export const peekOldestRequestLog = async () => {
  const client = await getClient();
  const raw = await client.lIndex(REQUEST_LOGS_QUEUE_KEY, -1);
  if (!raw) return null;
  return JSON.parse(raw);
};

export const clearProcessingRequestLogs = async () => {
  const client = await getClient();
  await client.del(REQUEST_LOGS_PROCESSING_KEY);
};

export const acquireRequestLogsFlushLock = async (ttlSeconds) => {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const client = await getClient();
  const result = await client.set(REQUEST_LOGS_FLUSH_LOCK_KEY, token, {
    EX: ttlSeconds,
    NX: true,
  });
  return result === 'OK' ? token : null;
};

// Lua script that deletes the lock key only when the stored value matches the
// supplied token, preventing a worker from releasing another worker's lock.
const RELEASE_LOCK_SCRIPT = `
  if redis.call('get', KEYS[1]) == ARGV[1] then
    return redis.call('del', KEYS[1])
  else
    return 0
  end
`;

export const releaseRequestLogsFlushLock = async (token) => {
  const client = await getClient();
  await client.eval(RELEASE_LOCK_SCRIPT, {
    keys: [REQUEST_LOGS_FLUSH_LOCK_KEY],
    arguments: [token],
  });
};

export const clearRedisTestData = async () => {
  const client = await getClient();
  await client.flushDb();
};

export const sendRedisCommand = async (...args) => {
  const client = await getClient();
  return client.sendCommand(args);
};

export const withCache = async (key, ttlSeconds, fn) => {
  let cached = null;
  try {
    cached = await getJsonValue(key);
  } catch (err) {
    devError('withCache: Redis read error (treating as cache miss)', err);
  }
  if (cached !== null) return cached;
  const data = await fn();
  try {
    await setJsonValue(key, data, ttlSeconds);
  } catch (err) {
    devError('withCache: Redis write error (ignoring)', err);
  }
  return data;
};
