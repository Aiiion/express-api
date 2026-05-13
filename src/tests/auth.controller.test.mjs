import { jest } from '@jest/globals';
import {
  clearRedisTestData,
  getJsonValue,
  setJsonValue,
} from '../services/redis.service.mjs';

const sendEmailMock = jest.fn().mockResolvedValue({ success: true });

jest.unstable_mockModule('../services/email.service.mjs', () => ({
  sendEmail: sendEmailMock,
}));

const { initiateLogin, verifyCode } = await import('../controllers/v1/auth.controller.mjs');

const createResponse = () => {
  const response = {
    body: undefined,
    cookies: [],
    status: jest.fn(),
    send: jest.fn(),
    cookie: jest.fn(),
  };

  response.status.mockImplementation((code) => {
    response.statusCode = code;
    return response;
  });

  response.send.mockImplementation((body) => {
    response.body = body;
    return response;
  });

  response.cookie.mockImplementation((name, value, options) => {
    response.cookies.push({ name, value, options });
    return response;
  });

  return response;
};

describe('auth controller Redis sessions', () => {
  beforeEach(async () => {
    process.env.NODE_ENV = 'test';
    process.env.ADMIN_PASSWORD = 'test-password';
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.JWT_SECRET = 'jwt-secret';

    sendEmailMock.mockClear();
    await clearRedisTestData();
  });

  it('stores the verification session in Redis during login', async () => {
    const req = { body: { password: 'test-password' } };
    const res = createResponse();

    await initiateLogin(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('sessionToken');
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    const sessionData = await getJsonValue(`auth_session_${res.body.sessionToken}`);
    expect(sessionData).toEqual({
      code: expect.any(String),
      createdAt: expect.any(Number),
    });
  });

  it('increments failed attempts in Redis when verification uses the wrong code', async () => {
    const sessionToken = 'test-session';
    const res = createResponse();

    await setJsonValue(`auth_session_${sessionToken}`, {
      code: '123456',
      createdAt: Date.now(),
    }, 600);

    await verifyCode({
      body: {
        sessionToken,
        code: '000000',
      },
    }, res);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid verification code');

    const storedSession = await getJsonValue(`auth_session_${sessionToken}`);
    expect(storedSession.failedAttempts).toBe(1);
  });

  it('clears the Redis session after successful verification', async () => {
    const sessionToken = 'valid-session';
    const res = createResponse();

    await setJsonValue(`auth_session_${sessionToken}`, {
      code: '654321',
      createdAt: Date.now(),
    }, 600);

    await verifyCode({
      body: {
        sessionToken,
        code: '654321',
      },
    }, res);

    expect(res.statusCode).toBe(200);
    expect(res.cookie).toHaveBeenCalledTimes(1);
    expect(await getJsonValue(`auth_session_${sessionToken}`)).toBeNull();
  });
});
