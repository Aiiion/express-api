import { jest } from "@jest/globals";

// Mock the email service
const sendEmailMock = jest.fn().mockResolvedValue({ success: true });
jest.unstable_mockModule("../services/email.service.mjs", () => ({
  sendEmail: sendEmailMock,
}));

import request from "supertest";
import mcache from "memory-cache";

let app;
let server;
let start;
let stop;

describe("Auth Routes", () => {
  const originalEnv = { ...process.env };

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.ADMIN_PASSWORD = "test-password";
    process.env.ADMIN_EMAIL = "admin@test.com";
    process.env.JWT_SECRET = "test-jwt-secret";
    process.env.OWM_API_KEY = "test-key";

    const mod = await import("../index.mjs");
    app = mod.default;
    start = mod.start;
    stop = mod.stop;
    if (start) {
      server = await start(0);
    }
  });

  beforeEach(() => {
    sendEmailMock.mockClear();
    mcache.clear();
  });

  afterAll(async () => {
    Object.keys(originalEnv).forEach((key) => {
      process.env[key] = originalEnv[key];
    });
    if (stop) await stop();
    else if (server && typeof server.close === "function")
      await new Promise((r) => server.close(r));
  });

  describe("POST /v1/auth/login", () => {
    it("should return 400 when password is missing", async () => {
      const response = await request(app).post("/v1/auth/login").send({});
      expect(response.status).toBe(400);
    });

    it("should return 401 when password is incorrect", async () => {
      const response = await request(app)
        .post("/v1/auth/login")
        .send({ password: "wrong-password" });
      expect(response.status).toBe(401);
    });

    it("should return 200 and sessionToken when password is correct", async () => {
      const response = await request(app)
        .post("/v1/auth/login")
        .send({ password: "test-password" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("sessionToken");
      expect(response.body).toHaveProperty("expiresIn");
      expect(response.body.message).toBe("Verification code sent to email");
      expect(sendEmailMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST /v1/auth/verify", () => {
    it("should return 400 when sessionToken or code is missing", async () => {
      const response = await request(app).post("/v1/auth/verify").send({});
      expect(response.status).toBe(400);
    });

    it("should return 401 when sessionToken is invalid", async () => {
      const response = await request(app)
        .post("/v1/auth/verify")
        .send({ sessionToken: "invalid-token", code: "123456" });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid or expired session token");
    });

    it("should return 401 when code is incorrect", async () => {
      // First, initiate login to get a valid session
      const loginResponse = await request(app)
        .post("/v1/auth/login")
        .send({ password: "test-password" });

      const { sessionToken } = loginResponse.body;

      const response = await request(app)
        .post("/v1/auth/verify")
        .send({ sessionToken, code: "000000" });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid verification code");
    });

    it("should return 200 and JWT token when verification succeeds", async () => {
      // Set up a known session in cache
      const testSessionToken = "test-session-token";
      const testCode = "123456";
      mcache.put(`auth_session_${testSessionToken}`, {
        code: testCode,
        createdAt: Date.now(),
      });

      const response = await request(app)
        .post("/v1/auth/verify")
        .send({ sessionToken: testSessionToken, code: testCode });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Authentication successful");
      expect(response.body.expiresIn).toBe("3h");

      // Verify JWT is set as HTTP-only cookie
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'].some(cookie => /jwt_token=/.test(cookie))).toBe(true);

      // Session should be cleared after successful verification
      expect(mcache.get(`auth_session_${testSessionToken}`)).toBeNull();
    });
  });

  describe("GET /v1/auth/verify-token", () => {
    it("should return 400 when Authorization header is missing", async () => {
      const response = await request(app).get("/v1/auth/verify-token");
      expect(response.status).toBe(400);
    });

    it("should return 400 when Authorization header format is invalid", async () => {
      const response = await request(app)
        .get("/v1/auth/verify-token")
        .set("Authorization", "InvalidFormat");
      expect(response.status).toBe(400);
    });

    it("should return 401 when token is invalid", async () => {
      const response = await request(app)
        .get("/v1/auth/verify-token")
        .set("Authorization", "Bearer invalid-token");
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Invalid token");
    });

    it("should return 200 when token is valid", async () => {
      // First get a valid token through the auth flow
      const testSessionToken = "test-session-for-token";
      const testCode = "654321";
      mcache.put(`auth_session_${testSessionToken}`, {
        code: testCode,
        createdAt: Date.now(),
      });

      const verifyResponse = await request(app)
        .post("/v1/auth/verify")
        .send({ sessionToken: testSessionToken, code: testCode });

      // Extract JWT token from set-cookie header
      const cookies = verifyResponse.headers['set-cookie'];
      const jwtCookie = cookies.find(cookie => /jwt_token=/.test(cookie));
      const token = jwtCookie.split(';')[0].split('=')[1];

      const response = await request(app)
        .get("/v1/auth/verify-token")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Token is valid");
    });
  });
});
