import { jest } from '@jest/globals';

// --- Sequelize model mocks ---
const snapshotFindAllMock = jest.fn();
const snapshotUpdateMock  = jest.fn();
const scoreUpsertMock     = jest.fn();

jest.unstable_mockModule('../models/index.mjs', () => ({
  sequelize: {
    models: {
      ProviderForecastSnapshot: {
        findAll: snapshotFindAllMock,
        update:  snapshotUpdateMock,
      },
      ProviderAccuracyScore: {
        upsert: scoreUpsertMock,
      },
    },
  },
}));

// --- Observation service mocks ---
const smhiObsMock        = { getDailyStats: jest.fn() };
const frostObsMock       = { getDailyStats: jest.fn() };
const fmiObsMock         = { getDailyStats: jest.fn() };
const openMeteoObsMock   = { getDailyStats: jest.fn() };

jest.unstable_mockModule('../services/observations/smhiObs.service.mjs',          () => ({ default: smhiObsMock       }));
jest.unstable_mockModule('../services/observations/frostObs.service.mjs',         () => ({ default: frostObsMock      }));
jest.unstable_mockModule('../services/observations/fmiObs.service.mjs',           () => ({ default: fmiObsMock        }));
jest.unstable_mockModule('../services/observations/openMeteoArchive.service.mjs', () => ({ default: openMeteoObsMock  }));

const { evaluateProviderAccuracy } = await import('../jobs/evaluate-provider-accuracy.mjs');

// Helper — creates a fake snapshot row
const makeSnap = (overrides = {}) => ({
  id:            1,
  provider:      'smhi.se',
  lat:           '59.34',
  lon:           '18.05',
  country_code:  'SE',
  valid_for:     '2026-06-23',
  avg_temp:      13.0,
  total_precip:   0.5,
  avg_wind_speed: 4.0,
  avg_humidity:  72.0,
  avg_pressure:  null,
  evaluated:     false,
  ...overrides,
});

const OBS = { avg_temp: 12.0, total_precip: 0.3, avg_wind_speed: 3.5, avg_humidity: 75.0, avg_pressure: null };

describe('evaluateProviderAccuracy', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-24T06:00:00Z'));

    snapshotFindAllMock.mockReset();
    snapshotUpdateMock.mockReset().mockResolvedValue([1]);
    scoreUpsertMock.mockReset().mockResolvedValue([{}, true]);

    smhiObsMock.getDailyStats.mockResolvedValue(OBS);
    frostObsMock.getDailyStats.mockResolvedValue(OBS);
    fmiObsMock.getDailyStats.mockResolvedValue(OBS);
    openMeteoObsMock.getDailyStats.mockResolvedValue(OBS);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns early when there are no unevaluated snapshots for yesterday', async () => {
    snapshotFindAllMock.mockResolvedValue([]);
    const result = await evaluateProviderAccuracy();
    expect(result).toBeUndefined();
    expect(scoreUpsertMock).not.toHaveBeenCalled();
  });

  it('marks all processed snapshots as evaluated', async () => {
    const snap = makeSnap();
    snapshotFindAllMock
      .mockResolvedValueOnce([snap])  // unevaluated query
      .mockResolvedValueOnce([snap]); // 30-day window query
    smhiObsMock.getDailyStats.mockResolvedValue(OBS);

    await evaluateProviderAccuracy();

    expect(snapshotUpdateMock).toHaveBeenCalledWith(
      { evaluated: true },
      expect.objectContaining({ where: expect.objectContaining({ id: expect.anything() }) })
    );
  });

  it('routes SE snapshots to smhiObs and GL snapshots to openMeteoArchive', async () => {
    const seSnap = makeSnap({ id: 1, country_code: 'SE' });
    const glSnap = makeSnap({ id: 2, country_code: 'GL', lat: '40.71', lon: '-74.01' });

    snapshotFindAllMock
      .mockResolvedValueOnce([seSnap, glSnap])
      .mockResolvedValueOnce([seSnap, glSnap]);

    await evaluateProviderAccuracy();

    expect(smhiObsMock.getDailyStats).toHaveBeenCalled();
    expect(openMeteoObsMock.getDailyStats).toHaveBeenCalled();
    expect(frostObsMock.getDailyStats).not.toHaveBeenCalled();
    expect(fmiObsMock.getDailyStats).not.toHaveBeenCalled();
  });

  it('routes NO to frostObs and FI to fmiObs', async () => {
    const noSnap = makeSnap({ id: 1, country_code: 'NO', lat: '59.94', lon: '10.72' });
    const fiSnap = makeSnap({ id: 2, country_code: 'FI', lat: '60.18', lon: '24.94' });

    snapshotFindAllMock
      .mockResolvedValueOnce([noSnap, fiSnap])
      .mockResolvedValueOnce([noSnap, fiSnap]);

    await evaluateProviderAccuracy();

    expect(frostObsMock.getDailyStats).toHaveBeenCalled();
    expect(fmiObsMock.getDailyStats).toHaveBeenCalled();
  });

  it('computes correct MAE and upserts accuracy scores', async () => {
    const snap = makeSnap({ avg_temp: 13.0, total_precip: 0.5, avg_wind_speed: 4.0, avg_humidity: 72.0 });
    snapshotFindAllMock
      .mockResolvedValueOnce([snap])
      .mockResolvedValueOnce([snap]);
    smhiObsMock.getDailyStats.mockResolvedValue(OBS);

    await evaluateProviderAccuracy();

    const [upsertData] = scoreUpsertMock.mock.calls[0];
    expect(upsertData.temp_mae).toBeCloseTo(Math.abs(13.0 - 12.0), 5);
    expect(upsertData.precip_mae).toBeCloseTo(Math.abs(0.5 - 0.3), 5);
    expect(upsertData.wind_mae).toBeCloseTo(Math.abs(4.0 - 3.5), 5);
    expect(upsertData.humidity_mae).toBeCloseTo(Math.abs(72.0 - 75.0), 5);
    expect(upsertData.provider).toBe('smhi.se');
    expect(upsertData.country_code).toBe('SE');
  });

  it('continues when an observation fetch fails for one coordinate', async () => {
    const snap = makeSnap();
    snapshotFindAllMock
      .mockResolvedValueOnce([snap])
      .mockResolvedValueOnce([]);
    smhiObsMock.getDailyStats.mockRejectedValue(new Error('Station timeout'));

    // Should not throw; snapshot still gets marked evaluated
    await expect(evaluateProviderAccuracy()).resolves.toBeDefined();
    expect(snapshotUpdateMock).toHaveBeenCalled();
  });
});
