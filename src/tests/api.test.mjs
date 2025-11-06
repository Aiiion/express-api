import { jest } from "@jest/globals";
import {
  weather,
  weatherForecast,
  airPollution,
  airPollutionForecast,
} from "../fixtures/openWeatherMaps.fixture.mjs";

jest.unstable_mockModule("../services/openWeatherMaps.service.mjs", () => ({
  currentWeather: jest.fn().mockResolvedValue(weather),
  forecastWeather: jest.fn().mockResolvedValue(weatherForecast),
  currentPollution: jest.fn().mockResolvedValue(airPollution),
  forecastPollution: jest.fn().mockResolvedValue(airPollutionForecast),
}));

import request from "supertest";
// Dynamically import app and server after the mock is set up
const { default: app, server } = await import("../index.mjs");

describe("API Routes", () => {
  const validQueryParams = {
    lat: "40.7128",
    lon: "-74.0060",
  };

  beforeAll(() => {
    process.env.WEATHER_API_KEY = 'test-key';
    process.env.ENVIRONMENT = 'test';
  });

  afterAll((done) => {
    server.close(done);
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
