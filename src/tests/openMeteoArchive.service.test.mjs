import { jest } from '@jest/globals';
import { openMeteoArchiveFixture } from '../fixtures/openMeteoArchive.fixture.mjs';

const { default: openMeteoArchiveService } = await import('../services/observations/openMeteoArchive.service.mjs');

const mockJsonResponse = (body) => ({
  ok: true,
  json: () => Promise.resolve(body),
});

describe('openMeteoArchiveService.getDailyStats', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockJsonResponse(openMeteoArchiveFixture)
    );
  });

  afterEach(() => {
    fetchMock.mockRestore();
  });

  it('averages temperature_2m', async () => {
    const stats = await openMeteoArchiveService.getDailyStats(59.33, 18.06, '2026-06-23');
    expect(stats.avg_temp).toBeCloseTo((14.2 + 13.8) / 2, 5);
  });

  it('sums precipitation', async () => {
    const stats = await openMeteoArchiveService.getDailyStats(59.33, 18.06, '2026-06-23');
    // fixture: 0.0 + 0.5
    expect(stats.total_precip).toBeCloseTo(0.5, 5);
  });

  it('returns 0 for total_precip on a dry day, not null', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({
      ...openMeteoArchiveFixture,
      hourly: { ...openMeteoArchiveFixture.hourly, precipitation: [0.0, 0.0] },
    }));
    const stats = await openMeteoArchiveService.getDailyStats(59.33, 18.06, '2026-06-23');
    expect(stats.total_precip).toBe(0);
  });

  it('excludes null values from wind speed average', async () => {
    const stats = await openMeteoArchiveService.getDailyStats(59.33, 18.06, '2026-06-23');
    // fixture: [4.5, null] — only 4.5 is valid
    expect(stats.avg_wind_speed).toBeCloseTo(4.5, 5);
  });

  it('averages relative_humidity_2m and surface_pressure', async () => {
    const stats = await openMeteoArchiveService.getDailyStats(59.33, 18.06, '2026-06-23');
    expect(stats.avg_humidity).toBeCloseTo((75 + 78) / 2, 5);
    expect(stats.avg_pressure).toBeCloseTo((1013.0 + 1012.5) / 2, 5);
  });

  it('passes lat, lon, date, and wind_speed_unit=ms in the request URL', async () => {
    await openMeteoArchiveService.getDailyStats(59.33, 18.06, '2026-06-23');

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('latitude=59.33');
    expect(url).toContain('longitude=18.06');
    expect(url).toContain('start_date=2026-06-23');
    expect(url).toContain('end_date=2026-06-23');
    expect(url).toContain('wind_speed_unit=ms');
  });

  it('returns null stats when hourly data is missing', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({ latitude: 59.33 }));
    const stats = await openMeteoArchiveService.getDailyStats(59.33, 18.06, '2026-06-23');
    expect(stats).toBeNull();
  });

  it('throws when the API returns a non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429, statusText: 'Too Many Requests' });
    await expect(openMeteoArchiveService.getDailyStats(59.33, 18.06, '2026-06-23'))
      .rejects.toThrow('Open-Meteo archive error: 429');
  });
});
