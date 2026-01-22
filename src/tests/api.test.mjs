import { jest } from "@jest/globals";
import {
  weather,
  weatherForecast,
  airPollution,
  airPollutionForecast,
} from "../fixtures/openWeatherMaps.fixture.mjs";
import { ipLocation } from "../fixtures/weatherApi.fixture.mjs";

// Mock the OpenWeatherMaps service
jest.unstable_mockModule("../services/openWeatherMaps.service.mjs", () => ({
  default: {
    currentWeather: jest.fn().mockResolvedValue(weather.data),
    forecastWeather: jest.fn().mockResolvedValue(weatherForecast.data),
    currentPollution: jest.fn().mockResolvedValue(airPollution.data),
    forecastPollution: jest.fn().mockResolvedValue(airPollutionForecast.data),
  },
}));

// Mock the weatherApi service
jest.unstable_mockModule("../services/weatherApi.service.mjs", () => ({
  default: {
    getIpLocation: jest.fn().mockResolvedValue(ipLocation.data),
  },
}));

import request from "supertest";
import { exampleIp, exampleLatLon, exampleLat } from "../utils/constants.mjs";

// Dynamically import app/start/stop after the mock is set up
let app;
let server;
let start;
let stop;

describe("API Routes", () => {
  
  const originalEnv = process.env.NODE_ENV;
  const originalApiKey = process.env.OWM_API_KEY;

  beforeAll(async () => {
    process.env.OWM_API_KEY = 'test-key';
    process.env.NODE_ENV = 'test';
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
    process.env.NODE_ENV = originalEnv;
    if (stop) await stop();
    else if (server && typeof server.close === 'function') await new Promise((r) => server.close(r));
  });

  const simpleGetPaths = [
    '/',
    '/test',
  ];

  it.each(simpleGetPaths)('GET %s should return 200 OK', async (path) => {
    const response = await request(app).get(path);
    expect(response.status).toBe(200);
  });

  //get requests with query parameters
  it.each([
    ['/weather', exampleLatLon, 200],
    ['/weather/pollution', exampleLatLon, 200],
    ['/weather/aggregate', exampleLatLon, 200],
    ['/weather/aggregate', { lat: exampleLat }, 400],
    ['/weather/aggregate', { lat: exampleLat, lon: 'asd' }, 400],
    ['ip-location', {ip: exampleIp}, 200],
    ['ip-location', {ip: '9999.9999.9999.999'}, 400],
  ])('GET %s with %o -> %i', async (path, query, expected) => {
    const res = await request(app).get(path).query(query);
    expect(res.status).toBe(expected);
  });

  describe('GET /cv', () => {
    it('should return a PDF file with correct headers and non-empty body', async () => {
      const res = await request(app).get('/cv');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);

      const disposition = res.headers['content-disposition'] || '';
      expect(disposition).toMatch(/attachment/i);
      expect(disposition).toMatch(/filename=.*\.pdf/i);

      const contentLength = res.headers['content-length'] ? parseInt(res.headers['content-length'], 10) : null;
      const bodyLength = res.body && Buffer.isBuffer(res.body) ? res.body.length : (res.text ? Buffer.byteLength(res.text) : 0);
      if (contentLength !== null) {
        expect(contentLength).toBeGreaterThan(0);
      } else {
        expect(bodyLength).toBeGreaterThan(0);
      }
    });
  });
});
