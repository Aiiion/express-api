import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { sequelize } from "../models/index.mjs";

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
  const getAuthCookie = () => `jwt_token=${jwt.sign({ sub: 'test-user' }, process.env.JWT_SECRET, { expiresIn: '3h' })}`;

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
      const setCookies = response.headers["set-cookie"] ?? [];
      const jwtSetCookie = setCookies.find((cookie) => /^jwt_token=/.test(cookie));
      expect(jwtSetCookie).toBeDefined();
      expect(jwtSetCookie).toContain("HttpOnly");
      // Session should be cleared after successful verification
      expect(mcache.get(`auth_session_${testSessionToken}`)).toBeNull();
    });
  });

  describe("GET /v1/auth/verify-token", () => {
    it("should return 401 when jwt_token cookie is missing", async () => {
      const response = await request(app).get("/v1/auth/verify-token");
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Authentication required");
    });

    it("should return 401 when token is invalid", async () => {
      const response = await request(app)
        .get("/v1/auth/verify-token")
        .set("Cookie", "jwt_token=invalid-token");
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

      const response = await request(app)
        .get("/v1/auth/verify-token")
        .set("Cookie", jwtCookie);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Token is valid");
    });
  });

  describe("GET /v1/requestLogs/meta/:field", () => {
    it("should return 404 when field is not a valid log column", async () => {
      const response = await request(app)
        .get("/v1/requestLogs/meta/not_a_column")
        .set("Cookie", getAuthCookie());

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        code: 404,
        message: "Field not found for the requested resource",
      });
    });
  });

  describe("GET /v1/requestLogs", () => {
    it("should filter by a single code", async () => {
      const findAndCountAllSpy = jest.spyOn(sequelize.models.RequestLog, "findAndCountAll")
        .mockResolvedValue({ count: 1, rows: [{ id: 1, code: 404 }] });

      const response = await request(app)
        .get("/v1/requestLogs")
        .query({ code: "404" })
        .set("Cookie", getAuthCookie());

      expect(response.status).toBe(200);
      expect(findAndCountAllSpy).toHaveBeenCalledTimes(1);

      const queryOptions = findAndCountAllSpy.mock.calls[0][0];
      expect(queryOptions.where).toEqual({ code: 404 });
      expect(queryOptions.limit).toBe(100);
      expect(queryOptions.offset).toBe(0);

      findAndCountAllSpy.mockRestore();
    });

    it("should filter by multiple codes", async () => {
      const findAndCountAllSpy = jest.spyOn(sequelize.models.RequestLog, "findAndCountAll")
        .mockResolvedValue({ count: 2, rows: [{ id: 1, code: 400 }, { id: 2, code: 404 }] });

      const response = await request(app)
        .get("/v1/requestLogs")
        .query({ code: ["400", "404"] })
        .set("Cookie", getAuthCookie());

      expect(response.status).toBe(200);
      expect(findAndCountAllSpy).toHaveBeenCalledTimes(1);

      const queryOptions = findAndCountAllSpy.mock.calls[0][0];
      expect(queryOptions.where.code[Op.in]).toEqual([400, 404]);

      findAndCountAllSpy.mockRestore();
    });

    it("should filter with search across route, ip and description", async () => {
      const findAndCountAllSpy = jest.spyOn(sequelize.models.RequestLog, "findAndCountAll")
        .mockResolvedValue({ count: 1, rows: [{ id: 1, code: 200 }] });

      const response = await request(app)
        .get("/v1/requestLogs")
        .query({ search: "api" })
        .set("Cookie", getAuthCookie());

      expect(response.status).toBe(200);
      expect(findAndCountAllSpy).toHaveBeenCalledTimes(1);

      const queryOptions = findAndCountAllSpy.mock.calls[0][0];
      expect(queryOptions.where[Op.or]).toEqual([
        { route: { [Op.iLike]: "%api%" } },
        { ip: { [Op.iLike]: "%api%" } },
        { description: { [Op.iLike]: "%api%" } },
      ]);

      findAndCountAllSpy.mockRestore();
    });

    it("should combine code and search filters with pagination", async () => {
      const findAndCountAllSpy = jest.spyOn(sequelize.models.RequestLog, "findAndCountAll")
        .mockResolvedValue({ count: 150, rows: [{ id: 101, code: 500 }] });

      const response = await request(app)
        .get("/v1/requestLogs")
        .query({ code: "500", search: "error", page: "2" })
        .set("Cookie", getAuthCookie());

      expect(response.status).toBe(200);
      expect(findAndCountAllSpy).toHaveBeenCalledTimes(1);

      const queryOptions = findAndCountAllSpy.mock.calls[0][0];
      expect(queryOptions.where.code).toBe(500);
      expect(queryOptions.where[Op.or]).toEqual([
        { route: { [Op.iLike]: "%error%" } },
        { ip: { [Op.iLike]: "%error%" } },
        { description: { [Op.iLike]: "%error%" } },
      ]);
      expect(queryOptions.limit).toBe(100);
      expect(queryOptions.offset).toBe(100);
      expect(response.body.pagination).toEqual({
        page: 2,
        perPage: 100,
        totalPages: 2,
        totalCount: 150,
      });

      findAndCountAllSpy.mockRestore();
    });
  });

  describe("GET /v1/errorLogs/meta/:field", () => {
    it("should return 404 when field is not a valid error log column", async () => {
      const response = await request(app)
        .get("/v1/errorLogs/meta/not_a_column")
        .set("Cookie", getAuthCookie());

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        code: 404,
        message: "Field not found for the requested resource",
      });
    });
  });

  describe("GET /v1/errorLogs", () => {
    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/v1/errorLogs");
      expect(response.status).toBe(401);
    });

    it("should return 200 with paginated results", async () => {
      const findAndCountAllSpy = jest.spyOn(sequelize.models.ErrorLog, "findAndCountAll")
        .mockResolvedValue({ count: 1, rows: [{ id: 1, message: "Test error" }] });

      const response = await request(app)
        .get("/v1/errorLogs")
        .set("Cookie", getAuthCookie());

      expect(response.status).toBe(200);
      expect(findAndCountAllSpy).toHaveBeenCalledTimes(1);

      const queryOptions = findAndCountAllSpy.mock.calls[0][0];
      expect(queryOptions.limit).toBe(100);
      expect(queryOptions.offset).toBe(0);

      findAndCountAllSpy.mockRestore();
    });

    it("should filter with search across message, route and stack_trace", async () => {
      const findAndCountAllSpy = jest.spyOn(sequelize.models.ErrorLog, "findAndCountAll")
        .mockResolvedValue({ count: 1, rows: [{ id: 1, message: "TypeError" }] });

      const response = await request(app)
        .get("/v1/errorLogs")
        .query({ search: "TypeError" })
        .set("Cookie", getAuthCookie());

      expect(response.status).toBe(200);
      expect(findAndCountAllSpy).toHaveBeenCalledTimes(1);

      const queryOptions = findAndCountAllSpy.mock.calls[0][0];
      expect(queryOptions.where[Op.or]).toEqual([
        { message: { [Op.iLike]: "%TypeError%" } },
        { route: { [Op.iLike]: "%TypeError%" } },
        { stack_trace: { [Op.iLike]: "%TypeError%" } },
      ]);

      findAndCountAllSpy.mockRestore();
    });

    it("should return correct pagination metadata", async () => {
      const findAndCountAllSpy = jest.spyOn(sequelize.models.ErrorLog, "findAndCountAll")
        .mockResolvedValue({ count: 250, rows: [{ id: 101, message: "Server error" }] });

      const response = await request(app)
        .get("/v1/errorLogs")
        .query({ page: "3" })
        .set("Cookie", getAuthCookie());

      expect(response.status).toBe(200);
      expect(findAndCountAllSpy).toHaveBeenCalledTimes(1);

      const queryOptions = findAndCountAllSpy.mock.calls[0][0];
      expect(queryOptions.limit).toBe(100);
      expect(queryOptions.offset).toBe(200);
      expect(response.body.pagination).toEqual({
        page: 3,
        perPage: 100,
        totalPages: 3,
        totalCount: 250,
      });

      findAndCountAllSpy.mockRestore();
    });
  });
});
