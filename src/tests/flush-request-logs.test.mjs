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

const { flushRequestLogs } = await import('../jobs/flush-request-logs.mjs');

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
        created_at: new Date(`2026-05-12T00:00:${String(index % 60).padStart(2, '0')}.000Z`).toISOString(),
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
});
