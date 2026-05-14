import { jest } from '@jest/globals';
import { EventEmitter } from 'node:events';
import { clearRedisTestData, getQueuedRequestLogs } from '../services/redis.service.mjs';
import { logRequest } from '../middleware/log.middleware.mjs';

describe('logRequest middleware', () => {
  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    await clearRedisTestData();
  });

  it('queues completed warning responses in request_logs', async () => {
    const middleware = logRequest();
    const req = {
      method: 'GET',
      originalUrl: '/v1/example',
      url: '/v1/example',
      headers: { 'user-agent': 'jest-agent' },
      socket: { remoteAddress: '127.0.0.1' },
    };
    const res = new EventEmitter();

    res.statusCode = 400;
    res.locals = {};
    res.json = function (body) {
      return body;
    };
    res.send = function (body) {
      return body;
    };
    res.end = function () {};

    const next = jest.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    res.json({ message: 'Invalid request' });
    res.emit('finish');
    await new Promise((resolve) => setImmediate(resolve));

    const queuedEntries = await getQueuedRequestLogs();
    expect(queuedEntries).toHaveLength(1);

    const requestLog = JSON.parse(queuedEntries[0]);
    expect(requestLog).toMatchObject({
      route: '/v1/example',
      method: 'GET',
      code: 400,
      type: 'WARN',
      description: 'Invalid request',
      user_agent: 'jest-agent',
    });
    expect(requestLog.stable_id).toEqual(expect.any(String));
    expect(requestLog.created_at).toEqual(expect.any(String));
  });
});
