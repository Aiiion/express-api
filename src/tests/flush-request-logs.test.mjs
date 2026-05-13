import { jest } from '@jest/globals';
import {
  clearRedisTestData,
  enqueueRequestLog,
  getRequestLogProcessingLength,
  getRequestLogQueueLength,
} from '../services/redis.service.mjs';

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

const { flushRequestLogs, PARTIAL_FLUSH_AGE_THRESHOLD_MS } = await import('../jobs/flush-request-logs.mjs');

describe('flushRequestLogs', () => {
  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    bulkCreateMock.mockReset();
    await clearRedisTestData();
  });

  it('flushes only full 40-log batches and leaves the remainder queued', async () => {
    bulkCreateMock.mockResolvedValue([]);

    for (let index = 0; index < 96; index += 1) {
      await enqueueRequestLog({
        ip: '127.0.0.1',
        route: `/logs/${index}`,
        method: 'GET',
        code: 200,
        type: 'INFO',
        // Fresh timestamps so the partial-flush age threshold is not triggered.
        created_at: new Date().toISOString(),
      });
    }

    const result = await flushRequestLogs();

    expect(result).toEqual({
      skipped: false,
      batches: 2,
      inserted: 80,
    });
    expect(bulkCreateMock).toHaveBeenCalledTimes(2);
    expect(bulkCreateMock.mock.calls[0][0]).toHaveLength(40);
    expect(bulkCreateMock.mock.calls[1][0]).toHaveLength(40);
    expect(bulkCreateMock.mock.calls[0][1]).toMatchObject({ ignoreDuplicates: true });
    expect(await getRequestLogQueueLength()).toBe(16);
    expect(await getRequestLogProcessingLength()).toBe(0);
  });

  it('keeps a batch in request_logs:processing when the database write fails', async () => {
    bulkCreateMock
      .mockRejectedValueOnce(new Error('db down'))
      .mockResolvedValueOnce([]);

    for (let index = 0; index < 40; index += 1) {
      await enqueueRequestLog({
        route: `/logs/${index}`,
        method: 'POST',
        code: 500,
        type: 'ERROR',
        created_at: new Date().toISOString(),
      });
    }

    await expect(flushRequestLogs()).rejects.toThrow('db down');
    expect(await getRequestLogQueueLength()).toBe(0);
    expect(await getRequestLogProcessingLength()).toBe(40);

    const retryResult = await flushRequestLogs();

    expect(retryResult).toEqual({
      skipped: false,
      batches: 1,
      inserted: 40,
    });
    expect(await getRequestLogQueueLength()).toBe(0);
    expect(await getRequestLogProcessingLength()).toBe(0);
  });

  it('flushes a partial batch when the oldest queued log exceeds the age threshold', async () => {
    bulkCreateMock.mockResolvedValue([]);

    const staleTimestamp = new Date(
      Date.now() - PARTIAL_FLUSH_AGE_THRESHOLD_MS - 60_000, // 1 minute past threshold
    ).toISOString();

    for (let index = 0; index < 15; index += 1) {
      await enqueueRequestLog({
        route: `/logs/${index}`,
        method: 'GET',
        code: 200,
        type: 'INFO',
        created_at: staleTimestamp,
      });
    }

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

    for (let index = 0; index < 15; index += 1) {
      await enqueueRequestLog({
        route: `/logs/${index}`,
        method: 'GET',
        code: 200,
        type: 'INFO',
        created_at: new Date().toISOString(),
      });
    }

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
