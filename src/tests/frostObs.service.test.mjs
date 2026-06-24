import { jest } from '@jest/globals';
import { frostObsFixture } from '../fixtures/frostObs.fixture.mjs';

const { default: frostObsService } = await import('../services/observations/frostObs.service.mjs');

const mockJsonResponse = (body) => ({
  ok: true,
  json: () => Promise.resolve(body),
});

describe('frostObsService.getDailyStats', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockJsonResponse(frostObsFixture)
    );
    process.env.MET_FROST_CLIENT_ID = 'test-client-id';
  });

  afterEach(() => {
    fetchMock.mockRestore();
    delete process.env.MET_FROST_CLIENT_ID;
  });

  it('averages air_temperature across all hourly observations', async () => {
    const stats = await frostObsService.getDailyStats(59.94, 10.72, '2026-06-23');
    // fixture: 12.3 and 13.1
    expect(stats.avg_temp).toBeCloseTo((12.3 + 13.1) / 2, 5);
  });

  it('sums precipitation across all hourly observations', async () => {
    const stats = await frostObsService.getDailyStats(59.94, 10.72, '2026-06-23');
    // fixture: 0.5 + 0.2
    expect(stats.total_precip).toBeCloseTo(0.7, 5);
  });

  it('averages wind_speed, relative_humidity, and air_pressure_at_sea_level', async () => {
    const stats = await frostObsService.getDailyStats(59.94, 10.72, '2026-06-23');
    expect(stats.avg_wind_speed).toBeCloseTo((5.2 + 4.8) / 2, 5);
    expect(stats.avg_humidity).toBeCloseTo((82.0 + 78.0) / 2, 5);
    expect(stats.avg_pressure).toBeCloseTo((1013.2 + 1012.8) / 2, 5);
  });

  it('sends Basic auth header using MET_FROST_CLIENT_ID as username', async () => {
    await frostObsService.getDailyStats(59.94, 10.72, '2026-06-23');

    const [, options] = fetchMock.mock.calls[0];
    const expected = 'Basic ' + Buffer.from('test-client-id:').toString('base64');
    expect(options.headers.Authorization).toBe(expected);
  });

  it('uses nearest(POINT(...)) with lon before lat in the sources param', async () => {
    await frostObsService.getDailyStats(59.94, 10.72, '2026-06-23');

    const [url] = fetchMock.mock.calls[0];
    // URLSearchParams encodes spaces as '+', so the POINT coords appear as '10.72+59.94'
    expect(decodeURIComponent(url)).toContain('nearest(POINT(10.72+59.94))');
  });

  it('throws when the API returns a non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, statusText: 'Unauthorized' });
    await expect(frostObsService.getDailyStats(59.94, 10.72, '2026-06-23'))
      .rejects.toThrow('Frost API error: 401');
  });

  it('returns null stats when data array is empty', async () => {
    fetchMock.mockResolvedValue(mockJsonResponse({ data: [] }));
    const stats = await frostObsService.getDailyStats(59.94, 10.72, '2026-06-23');
    expect(stats.avg_temp).toBeNull();
    expect(stats.total_precip).toBeNull();
  });
});
