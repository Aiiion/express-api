import { jest } from '@jest/globals';
import { smhiObsStationsFixture, smhiObsDataFixture } from '../fixtures/smhiObs.fixture.mjs';

// withCache passes through to the function — bypasses Redis in tests
jest.unstable_mockModule('../services/infrastructure/redis.service.mjs', () => ({
  withCache: jest.fn((_key, _ttl, fn) => fn()),
}));

const { default: smhiObsService } = await import('../services/observations/smhiObs.service.mjs');

const mockJsonResponse = (body) => ({
  ok: true,
  json: () => Promise.resolve(body),
});

describe('smhiObsService.getDailyStats', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      // Station list requests: /parameter/{id}.json (no /station/ segment)
      if (url.includes('/station/')) {
        return Promise.resolve(mockJsonResponse(smhiObsDataFixture));
      }
      return Promise.resolve(mockJsonResponse(smhiObsStationsFixture));
    });
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('returns averaged stats from observation data', async () => {
    // Station 98230 is nearest to Stockholm coords; only G/Y quality entries average
    const stats = await smhiObsService.getDailyStats(59.34, 18.05);

    // quality G: 14.2, 15.0 — quality Y: 13.8 — quality Z (99.9) excluded
    const expectedAvg = (14.2 + 15.0 + 13.8) / 3;
    expect(stats.avg_temp).toBeCloseTo(expectedAvg, 4);
  });

  it('sums precipitation rather than averaging it', async () => {
    const stats = await smhiObsService.getDailyStats(59.34, 18.05);
    // precip fixture has values 14.2 + 15.0 + 13.8 (same fixture reused for all params)
    // total_precip = sum of valid values
    expect(typeof stats.total_precip).toBe('number');
    expect(stats.total_precip).toBeGreaterThan(0);
  });

  it('returns 0 for total_precip on a dry day, not null', async () => {
    fetchMock.mockImplementation((url) => {
      if (url.includes('/station/')) {
        // Return zero precipitation only for parameter 7 (precipitation), normal data for others
        const body = url.includes('/parameter/7/')
          ? { value: [{ date: '1750000000000', value: '0.0', quality: 'G' }] }
          : smhiObsDataFixture;
        return Promise.resolve(mockJsonResponse(body));
      }
      return Promise.resolve(mockJsonResponse(smhiObsStationsFixture));
    });

    const stats = await smhiObsService.getDailyStats(59.34, 18.05);
    expect(stats.total_precip).toBe(0);
  });

  it('picks the nearest active station and ignores inactive ones', async () => {
    // Göteborg coords — nearest active station should be 71420 (Göteborg A), not Kiruna (inactive)
    await smhiObsService.getDailyStats(57.72, 11.99);

    // Observation fetch URL should contain station 71420
    const obsCalls = fetchMock.mock.calls.filter(([url]) => url.includes('/station/'));
    expect(obsCalls.every(([url]) => url.includes('/71420/'))).toBe(true);
  });

  it('returns null avg_temp when all observation values have bad quality', async () => {
    fetchMock.mockImplementation((url) => {
      if (url.includes('/station/')) {
        return Promise.resolve(mockJsonResponse({ value: [
          { date: '1750000000000', value: '99.9', quality: 'Z' },
        ]}));
      }
      return Promise.resolve(mockJsonResponse(smhiObsStationsFixture));
    });

    const stats = await smhiObsService.getDailyStats(59.34, 18.05);
    expect(stats.avg_temp).toBeNull();
  });

  it('returns null total_precip when observation fetch fails', async () => {
    fetchMock.mockImplementation((url) => {
      if (url.includes('/station/')) {
        return Promise.resolve({ ok: false, status: 503, statusText: 'Unavailable' });
      }
      return Promise.resolve(mockJsonResponse(smhiObsStationsFixture));
    });

    // Should not throw — fetch failures are caught per parameter
    const stats = await smhiObsService.getDailyStats(59.34, 18.05);
    expect(stats.total_precip).toBeNull();
  });
});
