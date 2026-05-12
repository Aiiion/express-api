import dotenv from 'dotenv';
import { createClient } from 'redis';
import { devError } from '../utils/logger.mjs';

dotenv.config();

const REQUEST_LOGS_QUEUE_KEY = 'request_logs';
const REQUEST_LOGS_PROCESSING_KEY = 'request_logs:processing';
const REQUEST_LOGS_FLUSH_LOCK_KEY = 'request_logs:flush_lock';

const testStore = new Map();
let redisClient;
let redisClientPromise;

const isTestEnv = () => process.env.NODE_ENV === 'test';

const getRedisUrl = () => process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;

const getTestEntry = (key) => {
  const entry = testStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    testStore.delete(key);
    return null;
  }
  return entry;
};

const setTestString = (key, value, ttlSeconds) => {
  testStore.set(key, {
    type: 'string',
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
};

const getTestList = (key) => {
  const entry = getTestEntry(key);
  if (!entry || entry.type !== 'list') return [];
  return [...entry.value];
};

const setTestList = (key, value) => {
  testStore.set(key, {
    type: 'list',
    value: [...value],
    expiresAt: null,
  });
};

const getClient = async () => {
  if (isTestEnv()) return null;
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
  if (isTestEnv()) {
    testStore.clear();
    return;
  }

  if (redisClient?.isOpen) await redisClient.quit();
  redisClient = undefined;
  redisClientPromise = undefined;
};

export const setJsonValue = async (key, value, ttlSeconds) => {
  const serializedValue = JSON.stringify(value);

  if (isTestEnv()) {
    setTestString(key, serializedValue, ttlSeconds);
    return;
  }

  const client = await getClient();
  if (ttlSeconds) {
    await client.set(key, serializedValue, { EX: ttlSeconds });
    return;
  }

  await client.set(key, serializedValue);
};

export const getJsonValue = async (key) => {
  if (isTestEnv()) {
    const entry = getTestEntry(key);
    if (!entry || entry.type !== 'string') return null;
    return JSON.parse(entry.value);
  }

  const client = await getClient();
  const serializedValue = await client.get(key);
  if (!serializedValue) return null;
  return JSON.parse(serializedValue);
};

export const deleteValue = async (key) => {
  if (isTestEnv()) {
    testStore.delete(key);
    return;
  }

  const client = await getClient();
  await client.del(key);
};

export const enqueueRequestLog = async (payload) => {
  const serializedPayload = JSON.stringify(payload);

  if (isTestEnv()) {
    const currentQueue = getTestList(REQUEST_LOGS_QUEUE_KEY);
    currentQueue.unshift(serializedPayload);
    setTestList(REQUEST_LOGS_QUEUE_KEY, currentQueue);
    return;
  }

  const client = await getClient();
  await client.lPush(REQUEST_LOGS_QUEUE_KEY, serializedPayload);
};

export const getRequestLogQueueLength = async () => {
  if (isTestEnv()) return getTestList(REQUEST_LOGS_QUEUE_KEY).length;

  const client = await getClient();
  return client.lLen(REQUEST_LOGS_QUEUE_KEY);
};

export const getRequestLogProcessingLength = async () => {
  if (isTestEnv()) return getTestList(REQUEST_LOGS_PROCESSING_KEY).length;

  const client = await getClient();
  return client.lLen(REQUEST_LOGS_PROCESSING_KEY);
};

export const moveRequestLogsToProcessing = async (count) => {
  if (!count || count < 1) return 0;

  if (isTestEnv()) {
    const queue = getTestList(REQUEST_LOGS_QUEUE_KEY);
    const processing = getTestList(REQUEST_LOGS_PROCESSING_KEY);
    let moved = 0;

    while (moved < count && queue.length > 0) {
      const entry = queue.pop();
      processing.unshift(entry);
      moved += 1;
    }

    if (queue.length > 0) setTestList(REQUEST_LOGS_QUEUE_KEY, queue);
    else testStore.delete(REQUEST_LOGS_QUEUE_KEY);

    if (processing.length > 0) setTestList(REQUEST_LOGS_PROCESSING_KEY, processing);
    else testStore.delete(REQUEST_LOGS_PROCESSING_KEY);

    return moved;
  }

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
  if (isTestEnv()) return getTestList(REQUEST_LOGS_PROCESSING_KEY);

  const client = await getClient();
  return client.lRange(REQUEST_LOGS_PROCESSING_KEY, 0, -1);
};

export const getQueuedRequestLogs = async () => {
  if (isTestEnv()) return getTestList(REQUEST_LOGS_QUEUE_KEY);

  const client = await getClient();
  return client.lRange(REQUEST_LOGS_QUEUE_KEY, 0, -1);
};

export const clearProcessingRequestLogs = async () => {
  if (isTestEnv()) {
    testStore.delete(REQUEST_LOGS_PROCESSING_KEY);
    return;
  }

  const client = await getClient();
  await client.del(REQUEST_LOGS_PROCESSING_KEY);
};

export const acquireRequestLogsFlushLock = async (ttlSeconds) => {
  const lockValue = String(Date.now());

  if (isTestEnv()) {
    const entry = getTestEntry(REQUEST_LOGS_FLUSH_LOCK_KEY);
    if (entry) return false;
    setTestString(REQUEST_LOGS_FLUSH_LOCK_KEY, lockValue, ttlSeconds);
    return true;
  }

  const client = await getClient();
  const result = await client.set(REQUEST_LOGS_FLUSH_LOCK_KEY, lockValue, {
    EX: ttlSeconds,
    NX: true,
  });

  return result === 'OK';
};

export const releaseRequestLogsFlushLock = async () => {
  await deleteValue(REQUEST_LOGS_FLUSH_LOCK_KEY);
};

export const clearRedisTestData = async () => {
  if (!isTestEnv()) return;
  testStore.clear();
};
