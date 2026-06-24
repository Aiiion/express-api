import { jest } from '@jest/globals';

const bulkCreateMock = jest.fn();

jest.unstable_mockModule('../models/index.mjs', () => ({
  sequelize: {
    models: {
      ProviderForecastSnapshot: { bulkCreate: bulkCreateMock },
    },
  },
}));

jest.unstable_mockModule('../utils/geoHelpers.mjs', () => ({
  getCoordinateBound: jest.fn(() => ({ country: 'Sweden' })),
}));

const owmDtoMock  = { forecastWeather: jest.fn() };
const wApiDtoMock = { forecastWeather: jest.fn() };
const smhiDtoMock = { forecastWeather: jest.fn() };
const metDtoMock  = { forecastWeather: jest.fn() };

jest.unstable_mockModule('../dtos/openWeatherMaps.dto.mjs', () => ({ default: owmDtoMock  }));
jest.unstable_mockModule('../dtos/weatherApi.dto.mjs',      () => ({ default: wApiDtoMock }));
jest.unstable_mockModule('../dtos/smhi.dto.mjs',            () => ({ default: smhiDtoMock }));
jest.unstable_mockModule('../dtos/met.dto.mjs',             () => ({ default: metDtoMock  }));

const { captureForecasts } = await import('../services/forecastSnapshot.service.mjs');
const { getCoordinateBound } = await import('../utils/geoHelpers.mjs');

// A fake provider result for "tomorrow" (date computed at test-run time)
const makeForecastSource = (provider, temp, precip) => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  return {
    list: {
      [tomorrow]: [
        {
          temperature: { temp },
          wind: { speed: 3.0 },
          humidity: 70,
          pressure: 1010,
          precipitation: { amount: precip },
        },
      ],
    },
    provider,
  };
};

describe('captureForecasts', () => {
  beforeEach(() => {
    bulkCreateMock.mockReset();
    getCoordinateBound.mockReturnValue({ country: 'Sweden' });

    owmDtoMock.forecastWeather.mockReturnValue(makeForecastSource('openweathermaps.org', 12.0, 0.5));
    wApiDtoMock.forecastWeather.mockReturnValue(makeForecastSource('weatherapi.com',     14.0, 0.2));
    smhiDtoMock.forecastWeather.mockReturnValue(makeForecastSource('smhi.se',            13.0, 0.0));
    metDtoMock.forecastWeather.mockReturnValue(makeForecastSource('met.no',              11.0, 1.0));
  });

  it('inserts one row per provider with the correct daily stats', async () => {
    await captureForecasts(
      {
        owmForecast:        { status: 'fulfilled', value: {} },
        weatherApiForecast: { status: 'fulfilled', value: {} },
        smhi:               { status: 'fulfilled', value: {} },
        met:                { status: 'fulfilled', value: {} },
      },
      59.3417, 18.0549
    );

    expect(bulkCreateMock).toHaveBeenCalledTimes(1);
    const rows = bulkCreateMock.mock.calls[0][0];
    expect(rows).toHaveLength(4);
    expect(rows.map(r => r.provider).sort()).toEqual(
      ['met.no', 'openweathermaps.org', 'smhi.se', 'weatherapi.com']
    );
  });

  it('rounds coordinates to 2 decimal places', async () => {
    await captureForecasts(
      { owmForecast: { status: 'fulfilled', value: {} }, weatherApiForecast: { status: 'rejected' }, smhi: { status: 'rejected' }, met: { status: 'rejected' } },
      59.3417, 18.0549
    );

    const [rows] = bulkCreateMock.mock.calls[0];
    expect(rows[0].lat).toBe(59.34);
    expect(rows[0].lon).toBe(18.05);
  });

  it('maps Sweden → SE, Norway → NO, Finland → FI, Global → GL', async () => {
    for (const [country, expected] of [['Sweden','SE'],['Norway','NO'],['Finland','FI'],['Global','GL']]) {
      bulkCreateMock.mockReset();
      getCoordinateBound.mockReturnValue({ country });
      await captureForecasts(
        { owmForecast: { status: 'fulfilled', value: {} }, weatherApiForecast: { status: 'rejected' }, smhi: { status: 'rejected' }, met: { status: 'rejected' } },
        59.34, 18.05
      );
      const [rows] = bulkCreateMock.mock.calls[0];
      expect(rows[0].country_code).toBe(expected);
    }
  });

  it('skips providers whose settled result is rejected', async () => {
    await captureForecasts(
      {
        owmForecast:        { status: 'rejected', reason: new Error('timeout') },
        weatherApiForecast: { status: 'fulfilled', value: {} },
        smhi:               { status: 'rejected', reason: new Error('timeout') },
        met:                { status: 'fulfilled', value: {} },
      },
      59.34, 18.05
    );

    const [rows] = bulkCreateMock.mock.calls[0];
    expect(rows).toHaveLength(2);
    expect(rows.map(r => r.provider).sort()).toEqual(['met.no', 'weatherapi.com']);
  });

  it('does not call bulkCreate when all providers fail', async () => {
    owmDtoMock.forecastWeather.mockReturnValue(null);
    wApiDtoMock.forecastWeather.mockReturnValue(null);
    smhiDtoMock.forecastWeather.mockReturnValue(null);
    metDtoMock.forecastWeather.mockReturnValue(null);

    await captureForecasts(
      {
        owmForecast:        { status: 'fulfilled', value: {} },
        weatherApiForecast: { status: 'fulfilled', value: {} },
        smhi:               { status: 'fulfilled', value: {} },
        met:                { status: 'fulfilled', value: {} },
      },
      59.34, 18.05
    );

    expect(bulkCreateMock).not.toHaveBeenCalled();
  });

  it('swallows bulkCreate errors silently', async () => {
    bulkCreateMock.mockRejectedValue(new Error('DB down'));

    // Should resolve without throwing
    await expect(
      captureForecasts(
        { owmForecast: { status: 'fulfilled', value: {} }, weatherApiForecast: { status: 'rejected' }, smhi: { status: 'rejected' }, met: { status: 'rejected' } },
        59.34, 18.05
      )
    ).resolves.toBeUndefined();
  });

  it('passes ignoreDuplicates: true to bulkCreate', async () => {
    await captureForecasts(
      { owmForecast: { status: 'fulfilled', value: {} }, weatherApiForecast: { status: 'rejected' }, smhi: { status: 'rejected' }, met: { status: 'rejected' } },
      59.34, 18.05
    );

    const [, options] = bulkCreateMock.mock.calls[0];
    expect(options).toMatchObject({ ignoreDuplicates: true });
  });
});
