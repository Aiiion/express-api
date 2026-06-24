import { jest } from '@jest/globals';
import { fmiObsFixture } from '../fixtures/fmiObs.fixture.mjs';

const fetchWfsBsSimpleMock = jest.fn();

jest.unstable_mockModule('../utils/wfs.mjs', () => ({
  fetchWfsBsSimple: fetchWfsBsSimpleMock,
}));

const { default: fmiObsService } = await import('../services/observations/fmiObs.service.mjs');

describe('fmiObsService.getDailyStats', () => {
  beforeEach(() => {
    fetchWfsBsSimpleMock.mockResolvedValue(fmiObsFixture);
  });

  afterEach(() => {
    fetchWfsBsSimpleMock.mockReset();
  });

  it('calls fetchWfsBsSimple with the correct stored query and parameters', async () => {
    await fmiObsService.getDailyStats(60.1752, 24.9446, '2026-06-23');

    expect(fetchWfsBsSimpleMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        storedquery_id: 'fmi::observations::weather::simple',
        latlon: '60.1752,24.9446',
        starttime: '2026-06-23T00:00:00Z',
        endtime: '2026-06-23T23:59:59Z',
      })
    );
  });

  it('averages temperature across the timeSeries', async () => {
    const stats = await fmiObsService.getDailyStats(60.1752, 24.9446, '2026-06-23');
    // fixture: 12.5 + 12.1
    expect(stats.avg_temp).toBeCloseTo((12.5 + 12.1) / 2, 5);
  });

  it('sums precipitation1h across the timeSeries', async () => {
    const stats = await fmiObsService.getDailyStats(60.1752, 24.9446, '2026-06-23');
    // fixture: 0.0 + 0.4
    expect(stats.total_precip).toBeCloseTo(0.4, 5);
  });

  it('averages windspeedms, humidity, and pressure', async () => {
    const stats = await fmiObsService.getDailyStats(60.1752, 24.9446, '2026-06-23');
    expect(stats.avg_wind_speed).toBeCloseTo((3.2 + 2.8) / 2, 5);
    expect(stats.avg_humidity).toBeCloseTo((78.0 + 80.0) / 2, 5);
    expect(stats.avg_pressure).toBeCloseTo((1015.0 + 1014.6) / 2, 5);
  });

  it('returns null when timeSeries is empty', async () => {
    fetchWfsBsSimpleMock.mockResolvedValue({ timeSeries: [] });
    const stats = await fmiObsService.getDailyStats(60.1752, 24.9446, '2026-06-23');
    expect(stats).toBeNull();
  });

  it('propagates errors from fetchWfsBsSimple', async () => {
    fetchWfsBsSimpleMock.mockRejectedValue(new Error('WFS error'));
    await expect(fmiObsService.getDailyStats(60.1752, 24.9446, '2026-06-23'))
      .rejects.toThrow('WFS error');
  });
});
