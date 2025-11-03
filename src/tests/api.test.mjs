import request from 'supertest';
import app from '../index.mjs';

describe('API Routes', () => {
  const validQueryParams = {
    lat: '40.7128',
    lon: '-74.0060'
  };

  // beforeAll(() => {
  //   process.env.WEATHER_API_KEY = 'test-key';
  // });

  describe('GET /', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
    });
  });

  describe('GET /test', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    });
  });

  describe('GET /weather', () => {
    it('should return 200 OK with valid parameters', async () => {
      const response = await request(app)
        .get('/weather')
        .query(validQueryParams);
      expect(response.status).toBe(200);
    });
  });

  describe('GET /weather/pollution', () => {
    it('should return 200 OK with valid parameters', async () => {
      const response = await request(app)
        .get('/weather/pollution')
        .query(validQueryParams);
      expect(response.status).toBe(200);
    });
  });

  describe('GET /weather/aggregate', () => {
    it('should return 200 OK with valid parameters', async () => {
      const response = await request(app)
        .get('/weather/aggregate')
        .query(validQueryParams);
      expect(response.status).toBe(200);
    });
  });
});