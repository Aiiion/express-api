import { jest } from "@jest/globals";
import {
  weather,
  weatherForecast,
  airPollution,
  airPollutionForecast,
} from "../fixtures/openWeatherMaps.fixture.mjs";

jest.unstable_mockModule("../services/openWeatherMaps.service.mjs", () => ({
  default: {
    currentWeather: jest.fn().mockResolvedValue(weather.data),
    forecastWeather: jest.fn().mockResolvedValue(weatherForecast.data),
    currentPollution: jest.fn().mockResolvedValue(airPollution.data),
    forecastPollution: jest.fn().mockResolvedValue(airPollutionForecast.data),
  },
}));

import request from "supertest";
// Dynamically import app/start/stop after the mock is set up
let app;
let server;
let start;
let stop;

describe("API Routes", () => {
  const validQueryParams = {
    lat: "40.7128",
    lon: "-74.0060",
  };
  const originalEnv = process.env.ENVIRONMENT;
  const originalApiKey = process.env.OWM_API_KEY;

  beforeAll(async () => {
    process.env.OWM_API_KEY = 'test-key';
    process.env.ENVIRONMENT = 'test';
    // import app after env is set and mocks registered
    const mod = await import("../index.mjs");
    app = mod.default;
    start = mod.start;
    stop = mod.stop;
    if (start) {
      // listen on ephemeral port to avoid conflicts
      server = await start(0);
    }
  });

  afterAll(async () => {
    process.env.OWM_API_KEY = originalApiKey;
    process.env.ENVIRONMENT = originalEnv;
    if (stop) await stop();
    else if (server && typeof server.close === 'function') await new Promise((r) => server.close(r));
  });

  describe("GET /", () => {
    it("should return 200 OK", async () => {
      const response = await request(app).get("/");
      expect(response.status).toBe(200);
    });
  });

  describe("GET /test", () => {
    it("should return 200 OK", async () => {
      const response = await request(app).get("/test");
      expect(response.status).toBe(200);
    });
  });

  describe("GET /weather", () => {
    it("should return 200 OK with valid parameters", async () => {
      const response = await request(app)
        .get("/weather")
        .query(validQueryParams);
      expect(response.status).toBe(200);
    });
  });

  describe("GET /weather/pollution", () => {
    it("should return 200 OK with valid parameters", async () => {
      const response = await request(app)
        .get("/weather/pollution")
        .query(validQueryParams);
      expect(response.status).toBe(200);
    });
  });

  describe("GET /weather/aggregate", () => {
    it("should return 200 OK with valid parameters", async () => {
      const response = await request(app)
        .get("/weather/aggregate")
        .query(validQueryParams);
      expect(response.status).toBe(200);
    });
  });
});
