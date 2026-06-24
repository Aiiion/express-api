import { jest } from '@jest/globals';
import {
  bulkEnqueueRequestLogs,
  clearRedisTestData,
  closeRedisConnection,
  getRequestLogProcessingLength,
  getRequestLogQueueLength,
} from '../services/infrastructure/redis.service.mjs';

const bulkCreateMock = jest.fn();

jest.unstable_mockModule('../models/index.mjs', () => ({
  sequelize: {
    models: {
      RequestLog: {
        bulkCreate: bulkCreateMock,
      },
    },
  },
}));

const { flushRequestLogs, PARTIAL_FLUSH_AGE_THRESHOLD_MS, REQUEST_LOG_BATCH_SIZE } = await import('../jobs/flush-request-logs.mjs');

const makeLog = (index, overrides = {}) => ({
  ip: '127.0.0.1',
  route: `/logs/${index}`,
  method: 'GET',
  code: 200,
  type: 'INFO',
  created_at: new Date().toISOString(),
  ...overrides,
});

describe('flushRequestLogs', () => {
  afterAll(async () => {
    await closeRedisConnection();
  });

  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    bulkCreateMock.mockReset();
    await clearRedisTestData();
  });

  it('flushes only full batches and leaves the remainder queued', async () => {
    bulkCreateMock.mockResolvedValue([]);

    const remainder = 16;
    const total = REQUEST_LOG_BATCH_SIZE * 2 + remainder;

    await bulkEnqueueRequestLogs(
      Array.from({ length: total }, (_, i) => makeLog(i)),
    );

    const result = await flushRequestLogs();

    expect(result).toEqual({
      skipped: false,
      batches: 2,
      inserted: REQUEST_LOG_BATCH_SIZE * 2,
    });
    expect(bulkCreateMock).toHaveBeenCalledTimes(2);
    expect(bulkCreateMock.mock.calls[0][0]).toHaveLength(REQUEST_LOG_BATCH_SIZE);
    expect(bulkCreateMock.mock.calls[1][0]).toHaveLength(REQUEST_LOG_BATCH_SIZE);
    expect(bulkCreateMock.mock.calls[0][1]).toMatchObject({ ignoreDuplicates: true });
    expect(await getRequestLogQueueLength()).toBe(remainder);
    expect(await getRequestLogProcessingLength()).toBe(0);
  });

  it('keeps a batch in request_logs:processing when the database write fails', async () => {
    bulkCreateMock
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValueOnce([]);

    await bulkEnqueueRequestLogs(
      Array.from({ length: REQUEST_LOG_BATCH_SIZE }, (_, i) =>
        makeLog(i, { method: 'POST', code: 500, type: 'ERROR' }),
      ),
    );

    await expect(flushRequestLogs()).rejects.toThrow('db down');
    expect(await getRequestLogQueueLength()).toBe(0);
    expect(await getRequestLogProcessingLength()).toBe(REQUEST_LOG_BATCH_SIZE);

    const retryResult = await flushRequestLogs();

    expect(retryResult).toEqual({
      skipped: false,
      batches: 1,
      inserted: REQUEST_LOG_BATCH_SIZE,
    });
    expect(await getRequestLogQueueLength()).toBe(0);
    expect(await getRequestLogProcessingLength()).toBe(0);
  });

  it('flushes a partial batch when the oldest queued log exceeds the age threshold', async () => {
    bulkCreateMock.mockResolvedValue([]);

    const staleTimestamp = new Date(
      Date.now() - PARTIAL_FLUSH_AGE_THRESHOLD_MS - 60_000, // 1 minute past threshold
    ).toISOString();

    await bulkEnqueueRequestLogs(
      Array.from({ length: 15 }, (_, i) => makeLog(i, { created_at: staleTimestamp })),
    );

    const result = await flushRequestLogs();

    expect(result).toEqual({
      skipped: false,
      batches: 1,
      inserted: 15,
    });
    expect(bulkCreateMock).toHaveBeenCalledTimes(1);
    expect(bulkCreateMock.mock.calls[0][0]).toHaveLength(15);
    expect(await getRequestLogQueueLength()).toBe(0);
    expect(await getRequestLogProcessingLength()).toBe(0);
  });

  it('does not flush a partial batch when the oldest queued log is within the age threshold', async () => {
    bulkCreateMock.mockResolvedValue([]);

    await bulkEnqueueRequestLogs(
      Array.from({ length: 15 }, (_, i) => makeLog(i)),
    );

    const result = await flushRequestLogs();

    expect(result).toEqual({
      skipped: false,
      batches: 0,
      inserted: 0,
    });
    expect(bulkCreateMock).not.toHaveBeenCalled();
    expect(await getRequestLogQueueLength()).toBe(15);
    expect(await getRequestLogProcessingLength()).toBe(0);
  });
});
