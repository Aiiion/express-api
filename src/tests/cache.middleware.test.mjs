import { jest } from '@jest/globals';

const getJsonValueMock = jest.fn();
const setJsonValueMock = jest.fn().mockResolvedValue();

jest.unstable_mockModule('../services/redis.service.mjs', () => ({
  getJsonValue: getJsonValueMock,
  setJsonValue: setJsonValueMock,
}));

const { cache } = await import('../middleware/cache.middleware.mjs');

describe('cache middleware', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    getJsonValueMock.mockReset();
    setJsonValueMock.mockClear();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('returns a cached response when Redis has a value', async () => {
    const middleware = cache(60);
    const req = { originalUrl: '/v1/weather?lat=1&lon=2', url: '/v1/weather?lat=1&lon=2' };
    const res = { send: jest.fn() };
    const next = jest.fn();

    getJsonValueMock.mockResolvedValue({ ok: true });

    await middleware(req, res, next);

    expect(getJsonValueMock).toHaveBeenCalledWith('__express__/v1/weather?lat=1&lon=2');
    expect(res.send).toHaveBeenCalledWith({ ok: true });
    expect(next).not.toHaveBeenCalled();
  });

  it('stores the response in Redis on a cache miss', async () => {
    const middleware = cache(120);
    const req = { originalUrl: '/v1/weather?lat=1&lon=2', url: '/v1/weather?lat=1&lon=2' };
    const sendResponse = jest.fn();
    const res = { send: sendResponse };
    const next = jest.fn();

    getJsonValueMock.mockResolvedValue(null);

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    res.send({ payload: true });
    await Promise.resolve();

    expect(setJsonValueMock).toHaveBeenCalledWith(
      '__express__/v1/weather?lat=1&lon=2',
      { payload: true },
      120,
    );
    expect(sendResponse).toHaveBeenCalledWith({ payload: true });
  });
});
