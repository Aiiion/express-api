import { jest } from '@jest/globals';
import { translateEpochDate } from '../utils/dateTimeHelpers.mjs';

// Stable mock references created before module mocking so all tests share them
const weatherApiServiceMocks = {
  currentWeather: jest.fn(),
  forecastWeather: jest.fn(),
};

const weatherApiDtoMocks = {
  currentWeather: jest.fn(),
  forecastWeather: jest.fn(),
  weatherWarnings: jest.fn(),
};

const smhiServiceMocks = {
  forecastWeather: jest.fn(),
};

const smhiDtoMocks = {
  currentWeather: jest.fn(),
  forecastWeather: jest.fn(),
};

const metServiceMocks = {
  forecastWeather: jest.fn(),
};

const metDtoMocks = {
  currentWeather: jest.fn(),
  forecastWeather: jest.fn(),
  weatherWarnings: jest.fn(),
};

// Register mocks before any dynamic imports
jest.unstable_mockModule('../services/providers/weatherApi.service.mjs', () => ({
  default: weatherApiServiceMocks,
}));

jest.unstable_mockModule('../services/providers/smhi.service.mjs', () => ({
  default: smhiServiceMocks,
}));

jest.unstable_mockModule('../services/providers/met.service.mjs', () => ({
  default: metServiceMocks,
}));

jest.unstable_mockModule('../dtos/weatherApi.dto.mjs', () => ({
  default: weatherApiDtoMocks,
}));

jest.unstable_mockModule('../dtos/smhi.dto.mjs', () => ({
  default: smhiDtoMocks,
}));

jest.unstable_mockModule('../dtos/met.dto.mjs', () => ({
  default: metDtoMocks,
}));

const logErrorMock = jest.fn();
jest.unstable_mockModule('../services/errorLog.service.mjs', () => ({
  logError: logErrorMock,
}));

const captureForecastsMock = jest.fn();
jest.unstable_mockModule('../services/forecastSnapshot.service.mjs', () => ({
  captureForecasts: captureForecastsMock,
}));

// ---------------------------------------------------------------------------
// Pre-normalized test data (what the DTOs would return after transforming raw
// API responses). Using controlled values makes expected aggregations precise.
// ---------------------------------------------------------------------------

// A timestamp 24 h into the future so the aggregator's past-timeslot filter
// does not drop forecast entries in mock-based tests.
const FUTURE_DT = Math.floor(Date.now() / 1000) + 86400;

const weatherApiNormalizedCurrent = {
  weather: 'Clear',
  description: null,
  icon: '//cdn.weatherapi.com/weather/64x64/night/113.png',
  dt: 1000500,
  location: {
    country_code: null,
    coords: { lat: 59.3, lon: 18.0 },
    name: 'Stockholm',
    timezone: 'Europe/Stockholm',
  },
  temperature: { temp: 6.0, min: null, max: null, feels_like: 4.0 },
  pressure: 1030,
  humidity: 70,
  visibility: 10000,
  clouds: { all: 0 },
  elevation: { sea_level: null, ground_level: null },
  wind: { speed: 8.0, deg: 46, dir: 'NE', gust: 16.6 },
  precipitation: { amount: 0.0, hours_measured: 1, type: 'none' },
  sunrise: null,
  sunset: null,
  uv: 0.0,
  provider: 'weatherapi.com',
};

// Every provider's forecast hour sits at the same timestamp so they merge
const weatherApiForecastHour = {
  dt: FUTURE_DT,
  weather: 'Partly Cloudy',
  description: 'Partly Cloudy',
  icon: '//cdn.weatherapi.com/weather/64x64/night/116.png',
  temperature: { temp: 6.0, feels_like: 4.0, max: null, min: null },
  pressure: 1030,
  humidity: 70,
  visibility: 10000,
  elevation: { sea_level: null, ground_level: null },
  wind: { speed: 8.0, deg: 46, dir: 'NE', gust: 16.6 },
  clouds: { all: 25 },
  precipitation: { amount: 0.0, hours_measured: 1, type: 'none' },
};

const weatherApiNormalizedForecast = {
  list: { Monday: [weatherApiForecastHour] },
  provider: 'weatherapi.com',
};

// Values chosen so the three-way averages come out whole:
//   temp:     (6 + 10 + 8)      / 3 = 8.0
//   humidity: (70 + 80 + 75)    / 3 = 75.0
//   pressure: (1030+1010+1020)  / 3 = 1020.0
const smhiNormalizedCurrent = {
  weather: 'Clear sky',
  description: 'Clear sky',
  icon: null,
  dt: 1000200,
  location: {
    country_code: 'SE',
    coords: { lat: 58.577821, lon: 16.158549 },
    name: null,
    timezone: 'UTC',
  },
  temperature: { temp: 10.0, min: null, max: null, feels_like: null },
  pressure: 1010,
  humidity: 80,
  visibility: 13700,
  clouds: { all: 13 },
  elevation: { sea_level: null, ground_level: null },
  wind: { speed: 1.5, deg: 76, dir: null, gust: 2.9 },
  precipitation: { amount: 0.0, hours_measured: 1, type: 'none' },
  sunrise: null,
  sunset: null,
  uv: null,
  provider: 'smhi.se',
};

const smhiForecastHour = {
  dt: FUTURE_DT,
  weather: 'Clear sky',
  description: 'Clear sky',
  icon: null,
  temperature: { temp: 10.0, feels_like: null, max: null, min: null },
  pressure: 1010,
  humidity: 80,
  visibility: 13700,
  elevation: { sea_level: null, ground_level: null },
  wind: { speed: 1.5, deg: 76, dir: null, gust: 2.9 },
  clouds: { all: 13 },
  precipitation: { amount: 0.0, hours_measured: 1, type: 'none' },
};

const smhiNormalizedForecast = {
  list: { Monday: [smhiForecastHour] },
  provider: 'smhi.se',
};

const metNormalizedCurrent = {
  weather: 'Partly Cloudy',
  description: 'Partly Cloudy',
  icon: null,
  dt: 1000300,
  location: {
    country_code: null,
    coords: { lat: 59.4, lon: 18.0 },
    name: null,
    timezone: 'UTC',
  },
  temperature: { temp: 8.0, min: null, max: null, feels_like: null },
  pressure: 1020,
  humidity: 75,
  visibility: null,
  clouds: { all: 50 },
  elevation: { sea_level: null, ground_level: null },
  wind: { speed: 1.5, deg: 76, dir: null, gust: null },
  precipitation: { amount: 0.0, hours_measured: 1, type: 'none' },
  sunrise: null,
  sunset: null,
  uv: null,
  provider: 'met.no',
};

const yrForecastHour = {
  dt: FUTURE_DT,
  weather: 'Partly Cloudy',
  description: 'Partly Cloudy',
  icon: null,
  temperature: { temp: 8.0, feels_like: null, max: null, min: null },
  pressure: 1020,
  humidity: 75,
  visibility: null,
  elevation: { sea_level: null, ground_level: null },
  wind: { speed: 1.5, deg: 76, dir: null, gust: null },
  clouds: { all: 50 },
  precipitation: { amount: 0.0, hours_measured: 1, type: 'none' },
};

const metNormalizedForecast = {
  list: { Monday: [yrForecastHour] },
  provider: 'met.no',
};

// ---------------------------------------------------------------------------

let weatherAggregatorService;

describe('weatherAggregatorService', () => {
  beforeAll(async () => {
    const mod = await import('../services/weatherAggregator.service.mjs');
    weatherAggregatorService = mod.default;
  });

  // Reset every mock to a known-good state before each test to prevent
  // one test's overrides from leaking into the next.
  beforeEach(() => {
    weatherApiServiceMocks.currentWeather.mockResolvedValue({});
    weatherApiServiceMocks.forecastWeather.mockResolvedValue({});
    smhiServiceMocks.forecastWeather.mockResolvedValue({});
    metServiceMocks.forecastWeather.mockResolvedValue({});
    logErrorMock.mockClear();
    weatherApiDtoMocks.currentWeather.mockReturnValue(weatherApiNormalizedCurrent);
    weatherApiDtoMocks.forecastWeather.mockReturnValue(null);
    smhiDtoMocks.currentWeather.mockReturnValue(smhiNormalizedCurrent);
    smhiDtoMocks.forecastWeather.mockReturnValue(null);
    metDtoMocks.currentWeather.mockReturnValue(metNormalizedCurrent);
    metDtoMocks.forecastWeather.mockReturnValue(null);
  });

  // -------------------------------------------------------------------------
  // currentWeather
  // -------------------------------------------------------------------------
  describe('currentWeather', () => {
    it('averages numeric fields (temperature, humidity, pressure) across providers', async () => {
      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      expect(result.temperature.temp).toBeCloseTo(8.0); // (6 + 10 + 8) / 3
      expect(result.humidity).toBeCloseTo(75); // (70 + 80 + 75) / 3
      expect(result.pressure).toBeCloseTo(1020); // (1030 + 1010 + 1020) / 3
    });

    it('uses the WeatherAPI icon, the only one any provider serves', async () => {
      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      expect(result.icon).toBe('//cdn.weatherapi.com/weather/64x64/night/113.png');
    });

    it('fetches a one-day WeatherAPI forecast and hands it to the current DTO for sunrise/sunset', async () => {
      const currentPayload = { location: { tz_id: 'Europe/Stockholm' } };
      const forecastPayload = { forecast: { forecastday: [] } };
      weatherApiServiceMocks.currentWeather.mockResolvedValue(currentPayload);
      weatherApiServiceMocks.forecastWeather.mockResolvedValue(forecastPayload);

      await weatherAggregatorService.currentWeather(59.4, 18.0);

      expect(weatherApiServiceMocks.forecastWeather).toHaveBeenCalledWith(59.4, 18.0, 1);
      expect(weatherApiDtoMocks.currentWeather).toHaveBeenCalledWith(currentPayload, true, forecastPayload);
    });

    it('still normalizes WeatherAPI current data when its forecast call fails', async () => {
      const currentPayload = { location: { tz_id: 'Europe/Stockholm' } };
      weatherApiServiceMocks.currentWeather.mockResolvedValue(currentPayload);
      weatherApiServiceMocks.forecastWeather.mockRejectedValue(new Error('WeatherAPI forecast down'));

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      expect(weatherApiDtoMocks.currentWeather).toHaveBeenCalledWith(currentPayload, true, null);
      expect(result.providers).toContain('weatherapi.com');
      expect(result.errors).toBeUndefined();
      // Nothing else sees this call, so a silent failure would read as a permanently null sunrise
      expect(logErrorMock).toHaveBeenCalledWith(expect.objectContaining({ message: 'WeatherAPI forecast down' }), {
        route: 'weatherAggregator.currentWeather',
      });
    });

    it('uses the most recent dt (maximum) across providers', async () => {
      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      expect(result.dt).toBe(1000500); // max(1000500, 1000200, 1000300)
    });

    it('includes every provider name in the providers array', async () => {
      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      expect(result.providers).toContain('weatherapi.com');
      expect(result.providers).toContain('smhi.se');
      expect(result.providers).toContain('met.no');
    });

    it('omits the errors property when all providers succeed', async () => {
      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      expect(result.errors).toBeUndefined();
    });

    it('averages wind direction with a circular mean and re-derives the compass label', async () => {
      weatherApiDtoMocks.currentWeather.mockReturnValue({
        ...weatherApiNormalizedCurrent,
        wind: { speed: 8.0, deg: 10, dir: 'N', gust: null },
      });
      smhiDtoMocks.currentWeather.mockReturnValue({
        ...smhiNormalizedCurrent,
        wind: { speed: 1.5, deg: 350, dir: null, gust: null },
      });
      metDtoMocks.currentWeather.mockReturnValue({
        ...metNormalizedCurrent,
        wind: { speed: 1.5, deg: null, dir: null, gust: null },
      });

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      // circular mean of 350° and 10° is 0° — a naive average would give 180°
      expect(result.wind.deg).toBe(0);
      expect(result.wind.dir).toBe('N');
    });

    it('derives the compass label from the merged bearing even when no provider supplied one', async () => {
      // Only WeatherAPI ever sends `dir`; with it down the label must still exist
      weatherApiDtoMocks.currentWeather.mockReturnValue(null);
      smhiDtoMocks.currentWeather.mockReturnValue({
        ...smhiNormalizedCurrent,
        wind: { speed: 1.5, deg: 80, dir: null, gust: null },
      });
      metDtoMocks.currentWeather.mockReturnValue({
        ...metNormalizedCurrent,
        wind: { speed: 1.5, deg: 100, dir: null, gust: null },
      });

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      expect(result.wind.deg).toBe(90);
      expect(result.wind.dir).toBe('E');
    });

    it("picks the majority weather description instead of the first provider's", async () => {
      weatherApiDtoMocks.currentWeather.mockReturnValue({ ...weatherApiNormalizedCurrent, weather: 'Clear' });
      smhiDtoMocks.currentWeather.mockReturnValue({ ...smhiNormalizedCurrent, weather: 'Cloudy' });
      metDtoMocks.currentWeather.mockReturnValue({ ...metNormalizedCurrent, weather: 'Cloudy' });

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      expect(result.weather).toBe('Cloudy');
    });

    describe('condition consensus', () => {
      // Each provider names the weather in its own vocabulary, so the shared
      // `condition` code is what the vote is actually decided on. The mocks
      // below keep the display text deliberately unlike each other to prove
      // the vote does not depend on the strings matching.
      const withCondition = (base, condition, overrides = {}) => ({
        ...base,
        condition,
        ...overrides,
      });

      it('takes the majority condition group even when no two providers word it alike', async () => {
        weatherApiDtoMocks.currentWeather.mockReturnValue(
          withCondition(weatherApiNormalizedCurrent, 'clear', { weather: 'Sunny' }),
        );
        smhiDtoMocks.currentWeather.mockReturnValue(
          withCondition(smhiNormalizedCurrent, 'rain', { weather: 'Moderate rain' }),
        );
        metDtoMocks.currentWeather.mockReturnValue(
          withCondition(metNormalizedCurrent, 'heavy_rain', { weather: 'Heavyrain' }),
        );

        const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

        // 2 of 3 say rain, so the cloud vote loses. Ranks in the winning group
        // are moderate(2)/heavy(3) — the lower-middle median is moderate.
        expect(result.condition).toBe('rain');
        // Text comes from a provider that actually predicted that condition
        expect(result.weather).toBe('Moderate rain');
      });

      it('resolves intensity by median rather than letting one outlier decide', async () => {
        weatherApiDtoMocks.currentWeather.mockReturnValue(withCondition(weatherApiNormalizedCurrent, 'light_snow'));
        smhiDtoMocks.currentWeather.mockReturnValue(withCondition(smhiNormalizedCurrent, 'light_snow'));
        metDtoMocks.currentWeather.mockReturnValue(withCondition(metNormalizedCurrent, 'heavy_snow'));

        const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

        // Ranks [0, 0, 2]; the median wins, so a single "heavy" call cannot
        // pull the forecast up on its own
        expect(result.condition).toBe('light_snow');
      });

      describe('even group splits', () => {
        const precip = (amount, hours = 1) => ({
          precipitation: { amount, hours_measured: hours, type: amount > 0 ? 'rain' : 'none' },
        });

        // Outside the Nordics SMHI has no coverage, leaving WeatherAPI and
        // MET as the only voters — so every disagreement there is a tie
        beforeEach(() => {
          smhiDtoMocks.currentWeather.mockReturnValue(null);
        });

        it("lets the voters' precipitation amounts settle a dry-versus-wet tie", async () => {
          // 1 clear vs 1 rain, and the rain voter puts water in it: (0 + 0.6) / 2 = 0.3 mm/h
          weatherApiDtoMocks.currentWeather.mockReturnValue(
            withCondition(weatherApiNormalizedCurrent, 'clear', precip(0)),
          );
          metDtoMocks.currentWeather.mockReturnValue(withCondition(metNormalizedCurrent, 'light_rain', precip(0.6)));

          const wet = await weatherAggregatorService.currentWeather(59.4, 18.0);

          // Same split, but nobody forecasts any rain to go with the symbol
          metDtoMocks.currentWeather.mockReturnValue(withCondition(metNormalizedCurrent, 'light_rain', precip(0)));

          const dry = await weatherAggregatorService.currentWeather(59.4, 18.0);

          // The dry call is clear, not "light rain" beside an amount of 0
          expect(wet.condition).toBe('light_rain');
          expect(wet.precipitation.amount).toBeGreaterThan(0);
          expect(dry.condition).toBe('clear');
          expect(dry.precipitation.amount).toBe(0);
        });

        it('does not depend on which provider is listed first', async () => {
          // The wet voter is listed first this time, and still loses when the
          // amounts say dry
          weatherApiDtoMocks.currentWeather.mockReturnValue(
            withCondition(weatherApiNormalizedCurrent, 'light_rain', precip(0)),
          );
          metDtoMocks.currentWeather.mockReturnValue(withCondition(metNormalizedCurrent, 'clear', precip(0)));

          const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

          expect(result.condition).toBe('clear');
        });

        it('treats trace amounts as dry', async () => {
          // WeatherAPI's "patchy rain possible" hours carry a few hundredths of a mm
          weatherApiDtoMocks.currentWeather.mockReturnValue(
            withCondition(weatherApiNormalizedCurrent, 'light_rain', precip(0.03)),
          );
          metDtoMocks.currentWeather.mockReturnValue(withCondition(metNormalizedCurrent, 'clear', precip(0)));

          const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

          expect(result.condition).toBe('clear');
        });

        it('applies the wetness threshold in the units the sources report', async () => {
          // 0.01 in/h is 0.25 mm/h — wet — but would read as a trace if judged in mm
          weatherApiDtoMocks.currentWeather.mockReturnValue(
            withCondition(weatherApiNormalizedCurrent, 'clear', precip(0)),
          );
          metDtoMocks.currentWeather.mockReturnValue(withCondition(metNormalizedCurrent, 'rain', precip(0.01)));

          const imperial = await weatherAggregatorService.currentWeather(59.4, 18.0, false);
          const metric = await weatherAggregatorService.currentWeather(59.4, 18.0, true);

          expect(imperial.condition).toBe('rain');
          expect(metric.condition).toBe('clear');
        });

        it('falls back to severity for ties the amounts cannot separate', async () => {
          // Two wet groups: the numbers say wet either way
          weatherApiDtoMocks.currentWeather.mockReturnValue(
            withCondition(weatherApiNormalizedCurrent, 'rain', precip(1.0)),
          );
          metDtoMocks.currentWeather.mockReturnValue(withCondition(metNormalizedCurrent, 'snow', precip(1.0)));

          const wetTie = await weatherAggregatorService.currentWeather(59.4, 18.0);

          // Two dry groups: there is no amount to consult
          weatherApiDtoMocks.currentWeather.mockReturnValue(
            withCondition(weatherApiNormalizedCurrent, 'clear', precip(0)),
          );
          metDtoMocks.currentWeather.mockReturnValue(withCondition(metNormalizedCurrent, 'fog', precip(0)));

          const dryTie = await weatherAggregatorService.currentWeather(59.4, 18.0);

          expect(wetTie.condition).toBe('snow');
          expect(dryTie.condition).toBe('fog');
        });

        it('settles a three-way split the same way', async () => {
          // All three providers present and all disagreeing: cloud vs rain vs
          // fog. The lone wet voter's amount makes it wet.
          smhiDtoMocks.currentWeather.mockReturnValue(withCondition(smhiNormalizedCurrent, 'fog', precip(0)));
          weatherApiDtoMocks.currentWeather.mockReturnValue(
            withCondition(weatherApiNormalizedCurrent, 'clear', precip(0)),
          );
          metDtoMocks.currentWeather.mockReturnValue(withCondition(metNormalizedCurrent, 'rain', precip(0.9)));

          const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

          // (0 + 0 + 0.9) / 3 = 0.3 mm/h
          expect(result.condition).toBe('rain');
        });
      });

      it('ignores providers that could not classify their own response', async () => {
        weatherApiDtoMocks.currentWeather.mockReturnValue(withCondition(weatherApiNormalizedCurrent, 'unknown'));
        smhiDtoMocks.currentWeather.mockReturnValue(withCondition(smhiNormalizedCurrent, 'fog', { weather: 'Fog' }));
        metDtoMocks.currentWeather.mockReturnValue(withCondition(metNormalizedCurrent, 'unknown'));

        const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

        expect(result.condition).toBe('fog');
        expect(result.weather).toBe('Fog');
      });

      it("emits an icon for the consensus condition in WeatherAPI's URL format, even when WeatherAPI dissents", async () => {
        weatherApiDtoMocks.currentWeather.mockReturnValue(withCondition(weatherApiNormalizedCurrent, 'clear'));
        smhiDtoMocks.currentWeather.mockReturnValue(withCondition(smhiNormalizedCurrent, 'snow'));
        metDtoMocks.currentWeather.mockReturnValue(withCondition(metNormalizedCurrent, 'snow'));

        const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

        expect(result.condition).toBe('snow');
        // Clients render the URL form, and it must show snow, not WeatherAPI's
        // clear-sky icon (113). Night is read from WeatherAPI's own icon URL.
        expect(result.icon).toBe('//cdn.weatherapi.com/weather/64x64/night/332.png');
      });

      it('leaves the icon null when WeatherAPI, the only day/night hint, is down', async () => {
        weatherApiDtoMocks.currentWeather.mockReturnValue(null);
        smhiDtoMocks.currentWeather.mockReturnValue(withCondition(smhiNormalizedCurrent, 'rain'));
        metDtoMocks.currentWeather.mockReturnValue(withCondition(metNormalizedCurrent, 'rain'));

        const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

        expect(result.condition).toBe('rain');
        expect(result.icon).toBeNull();
      });

      it('falls back to generic string merging when no provider supplies a condition', async () => {
        // Guards the DTO-mocking tests elsewhere in this file, which return
        // objects with no `condition` key at all
        weatherApiDtoMocks.currentWeather.mockReturnValue({ ...weatherApiNormalizedCurrent, weather: 'Clear' });
        smhiDtoMocks.currentWeather.mockReturnValue({ ...smhiNormalizedCurrent, weather: 'Cloudy' });
        metDtoMocks.currentWeather.mockReturnValue({ ...metNormalizedCurrent, weather: 'Cloudy' });

        const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

        expect(result.condition).toBeUndefined();
        expect(result.weather).toBe('Cloudy');
      });
    });

    it('reports a provider whose DTO returns no usable data as an error', async () => {
      weatherApiDtoMocks.currentWeather.mockReturnValue(null);

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      expect(result.providers).not.toContain('weatherapi.com');
      expect(result.providers).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        provider: 'weatherapi.com',
        message: 'Provider returned no usable data',
      });
    });

    describe('output field rounding', () => {
      const makeCurrent = overrides => ({
        weather: 'Clouds',
        description: null,
        icon: null,
        dt: 1000000,
        location: { country_code: null, coords: { lat: 59.4, lon: 18.0 }, name: null, timezone: 'UTC' },
        temperature: { temp: 10.0, min: null, max: null, feels_like: null },
        pressure: 1010,
        humidity: 80,
        visibility: 10000,
        clouds: { all: 50 },
        elevation: { sea_level: null, ground_level: null },
        wind: { speed: 4.0, deg: 180, dir: null, gust: null },
        precipitation: { amount: 0.0, hours_measured: 1, type: 'none' },
        sunrise: null,
        sunset: null,
        uv: null,
        provider: 'test',
        ...overrides,
      });

      it('rounds temperature fields to the nearest integer', async () => {
        // (7.2 + 8.3 + 7.8) / 3 = 7.77 → 8
        weatherApiDtoMocks.currentWeather.mockReturnValue(
          makeCurrent({ temperature: { temp: 7.2, min: null, max: null, feels_like: 6.3 } }),
        );
        smhiDtoMocks.currentWeather.mockReturnValue(
          makeCurrent({ temperature: { temp: 8.3, min: 8.1, max: 12.9, feels_like: 9.7 } }),
        );
        metDtoMocks.currentWeather.mockReturnValue(
          makeCurrent({ temperature: { temp: 7.8, min: null, max: null, feels_like: null } }),
        );

        const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

        expect(Number.isInteger(result.temperature.temp)).toBe(true);
        expect(Number.isInteger(result.temperature.feels_like)).toBe(true);
        // min and max from one source only — still integer-rounded
        expect(Number.isInteger(result.temperature.min)).toBe(true);
        expect(Number.isInteger(result.temperature.max)).toBe(true);
      });

      it('rounds pressure to the nearest integer', async () => {
        // (1023.7 + 1016.2 + 1018.5) / 3 = 1019.47 → 1019
        weatherApiDtoMocks.currentWeather.mockReturnValue(makeCurrent({ pressure: 1023.7 }));
        smhiDtoMocks.currentWeather.mockReturnValue(makeCurrent({ pressure: 1016.2 }));
        metDtoMocks.currentWeather.mockReturnValue(makeCurrent({ pressure: 1018.5 }));

        const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

        expect(Number.isInteger(result.pressure)).toBe(true);
      });

      it('rounds visibility to the nearest integer', async () => {
        // (8000 + 11500 + 10000) / 3 = 9833.33… → 9833
        weatherApiDtoMocks.currentWeather.mockReturnValue(makeCurrent({ visibility: 8000 }));
        smhiDtoMocks.currentWeather.mockReturnValue(makeCurrent({ visibility: 11500 }));
        metDtoMocks.currentWeather.mockReturnValue(makeCurrent({ visibility: 10000 }));

        const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

        expect(Number.isInteger(result.visibility)).toBe(true);
        expect(result.visibility).toBe(9833);
      });

      it('rounds clouds.all to the nearest integer', async () => {
        // (33 + 50 + 66) / 3 = 49.67 → 50
        weatherApiDtoMocks.currentWeather.mockReturnValue(makeCurrent({ clouds: { all: 33 } }));
        smhiDtoMocks.currentWeather.mockReturnValue(makeCurrent({ clouds: { all: 50 } }));
        metDtoMocks.currentWeather.mockReturnValue(makeCurrent({ clouds: { all: 66 } }));

        const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

        expect(Number.isInteger(result.clouds.all)).toBe(true);
        expect(result.clouds.all).toBe(50);
      });

      it('rounds wind.speed and wind.gust to at most 2 decimal places', async () => {
        // speed: (8.5678 + 2.8765 + 3.1111) / 3 = 4.8518 → 4.85
        // gust:  (16.6789 + 2.8765) / 2 = 9.7777 → 9.78
        weatherApiDtoMocks.currentWeather.mockReturnValue(
          makeCurrent({ wind: { speed: 8.5678, deg: 46, dir: 'NE', gust: 16.6789 } }),
        );
        smhiDtoMocks.currentWeather.mockReturnValue(
          makeCurrent({ wind: { speed: 2.8765, deg: 76, dir: null, gust: 2.8765 } }),
        );
        metDtoMocks.currentWeather.mockReturnValue(
          makeCurrent({ wind: { speed: 3.1111, deg: 76, dir: null, gust: null } }),
        );

        const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

        const speedDecimals = (result.wind.speed.toString().split('.')[1] ?? '').length;
        const gustDecimals = (result.wind.gust.toString().split('.')[1] ?? '').length;
        expect(speedDecimals).toBeLessThanOrEqual(2);
        expect(gustDecimals).toBeLessThanOrEqual(2);
        expect(result.wind.speed).toBe(4.85);
        expect(result.wind.gust).toBe(9.78);
      });

      it('rounds precipitation.amount to at most 2 decimal places', async () => {
        // hourly rates: 1.8888, 2.1111, 0.5555 → avg = 1.518466… → 1.52
        weatherApiDtoMocks.currentWeather.mockReturnValue(
          makeCurrent({ precipitation: { amount: 1.8888, hours_measured: 1, type: 'rain' } }),
        );
        smhiDtoMocks.currentWeather.mockReturnValue(
          makeCurrent({ precipitation: { amount: 2.1111, hours_measured: 1, type: 'rain' } }),
        );
        metDtoMocks.currentWeather.mockReturnValue(
          makeCurrent({ precipitation: { amount: 0.5555, hours_measured: 1, type: 'rain' } }),
        );

        const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

        const decimals = (result.precipitation.amount.toString().split('.')[1] ?? '').length;
        expect(decimals).toBeLessThanOrEqual(2);
        expect(result.precipitation.amount).toBe(1.52);
      });
    });

    it('normalizes precipitation amounts when every provider reports 1-hour periods', async () => {
      weatherApiDtoMocks.currentWeather.mockReturnValue({
        ...weatherApiNormalizedCurrent,
        precipitation: { amount: 4.0, hours_measured: 1, type: 'rain' },
      });
      smhiDtoMocks.currentWeather.mockReturnValue({
        ...smhiNormalizedCurrent,
        precipitation: { amount: 2.0, hours_measured: 1, type: 'rain' },
      });
      metDtoMocks.currentWeather.mockReturnValue({
        ...metNormalizedCurrent,
        precipitation: { amount: 3.0, hours_measured: 1, type: 'rain' },
      });

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      // avgHourlyRate = (4/1 + 2/1 + 3/1) / 3 = 3.0 mm/h; targetHours = 1
      expect(result.precipitation.amount).toBeCloseTo(3.0);
      expect(result.precipitation.hours_measured).toBe(1);
      expect(result.precipitation.type).toBe('rain');
    });

    it('normalizes precipitation amounts across mismatched periods (3 h vs 1 h)', async () => {
      weatherApiDtoMocks.currentWeather.mockReturnValue({
        ...weatherApiNormalizedCurrent,
        precipitation: { amount: 1.0, hours_measured: 1, type: 'rain' },
      });
      smhiDtoMocks.currentWeather.mockReturnValue({
        ...smhiNormalizedCurrent,
        precipitation: { amount: 3.0, hours_measured: 3, type: 'rain' },
      });
      metDtoMocks.currentWeather.mockReturnValue({
        ...metNormalizedCurrent,
        precipitation: { amount: 1.0, hours_measured: 1, type: 'rain' },
      });

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      // avgHourlyRate = (1/1 + 3/3 + 1/1) / 3 = 1.0 mm/h; targetHours = min(1,3,1) = 1
      expect(result.precipitation.amount).toBeCloseTo(1.0);
      expect(result.precipitation.hours_measured).toBe(1);
      expect(result.precipitation.type).toBe('rain');
    });

    it('returns data from SMHI and Yr with an error entry when WeatherAPI fails', async () => {
      weatherApiServiceMocks.currentWeather.mockRejectedValue(new Error('WeatherAPI down'));

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      // SMHI (10.0) and Yr (8.0) are averaged
      expect(result.temperature.temp).toBe(9);
      expect(result.providers).toEqual(expect.arrayContaining(['smhi.se', 'met.no']));
      expect(result.providers).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].provider).toBe('weatherapi.com');
    });

    it('returns data from WeatherAPI and Yr with an error entry when SMHI fails', async () => {
      smhiServiceMocks.forecastWeather.mockRejectedValue(new Error('SMHI down'));

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      // WeatherAPI (6.0) and Yr (8.0) are averaged
      expect(result.temperature.temp).toBe(7);
      expect(result.providers).toEqual(expect.arrayContaining(['weatherapi.com', 'met.no']));
      expect(result.providers).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].provider).toBe('smhi.se');
    });

    it('returns data from WeatherAPI and SMHI with an error entry when Yr fails', async () => {
      metServiceMocks.forecastWeather.mockRejectedValue(new Error('Yr down'));

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      // WeatherAPI (6.0) and SMHI (10.0) are averaged
      expect(result.temperature.temp).toBe(8);
      expect(result.providers).toEqual(expect.arrayContaining(['weatherapi.com', 'smhi.se']));
      expect(result.providers).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].provider).toBe('met.no');
    });

    it('returns an error structure when all providers fail', async () => {
      weatherApiServiceMocks.currentWeather.mockRejectedValue(new Error('WeatherAPI down'));
      smhiServiceMocks.forecastWeather.mockRejectedValue(new Error('SMHI down'));
      metServiceMocks.forecastWeather.mockRejectedValue(new Error('Yr down'));

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      expect(result.error).toBe('All weather providers failed');
      expect(result.errors).toHaveLength(3);
    });
  });

  // -------------------------------------------------------------------------
  // forecastWeather
  // -------------------------------------------------------------------------
  describe('forecastWeather', () => {
    // Override the forecast DTO mocks with forecast-specific data for every
    // test in this describe block.
    beforeEach(() => {
      weatherApiDtoMocks.forecastWeather.mockReturnValue(weatherApiNormalizedForecast);
      smhiDtoMocks.forecastWeather.mockReturnValue(smhiNormalizedForecast);
      metDtoMocks.forecastWeather.mockReturnValue(metNormalizedForecast);
    });

    it('merges forecast data from every provider keyed by day and timestamp', async () => {
      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      expect(result.list).toHaveProperty('Monday');
      expect(result.list.Monday).toHaveLength(1);
    });

    it('averages numeric forecast fields at matching timestamps', async () => {
      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);
      const hour = result.list.Monday[0];

      expect(hour.temperature.temp).toBeCloseTo(8.0); // (6 + 10 + 8) / 3
      expect(hour.humidity).toBeCloseTo(75); // (70 + 80 + 75) / 3
      expect(hour.pressure).toBeCloseTo(1020); // (1030 + 1010 + 1020) / 3
    });

    it('prefers the WeatherAPI icon in merged forecast entries', async () => {
      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);
      const hour = result.list.Monday[0];

      expect(hour.icon).toBe('//cdn.weatherapi.com/weather/64x64/night/116.png');
    });

    it('includes every provider name in the providers array', async () => {
      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      expect(result.providers).toContain('weatherapi.com');
      expect(result.providers).toContain('smhi.se');
      expect(result.providers).toContain('met.no');
    });

    it('handles mismatched precipitation periods (SMHI 3h vs WeatherAPI 1h)', async () => {
      smhiDtoMocks.forecastWeather.mockReturnValue({
        ...smhiNormalizedForecast,
        list: {
          Monday: [{ ...smhiForecastHour, precipitation: { amount: 3.0, hours_measured: 3, type: 'rain' } }],
        },
      });
      weatherApiDtoMocks.forecastWeather.mockReturnValue({
        ...weatherApiNormalizedForecast,
        list: {
          Monday: [{ ...weatherApiForecastHour, precipitation: { amount: 1.0, hours_measured: 1, type: 'rain' } }],
        },
      });

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);
      const hour = result.list.Monday[0];

      // mergeHourlyData detects mismatched periods and delegates to the most
      // granular source (1h). adjustPrecipitationAcrossHours then averages
      // hourly *rates*, not window totals — SMHI's 3 mm over 3 h and
      // WeatherAPI's 1 mm over 1 h are both 1 mm/h, so the two providers agree
      // rather than disagreeing 3-to-1. MET predicts 0 mm/h, which is a real
      // "no rain" forecast and counts: (1 + 1 + 0) / 3 = 0.667 mm/h. The
      // window is 3 h wide (SMHI's period) and holds a single merged
      // timestamp, so that entry carries the whole window: 0.667 * 3 = 2 mm
      // over 3 hours.
      expect(hour.precipitation.hours_measured).toBe(3);
      expect(hour.precipitation.amount).toBeCloseTo(2.0);
      expect(hour.precipitation.type).toBe('rain');
    });

    it('does not let a source that covers only part of a window drag the average down', async () => {
      // A 3 h window on the provider grid, a day out so nothing is filtered as past
      const windowStart = Math.ceil((Math.floor(Date.now() / 1000) + 86400) / 10800) * 10800;
      const hourly = (dt, amount) => ({
        ...weatherApiForecastHour,
        dt,
        precipitation: { amount, hours_measured: 1, type: 'rain' },
      });

      // SMHI: one 3 h period covering the whole window — 3 mm over 3 h = 1 mm/h
      smhiDtoMocks.forecastWeather.mockReturnValue({
        ...smhiNormalizedForecast,
        list: {
          Monday: [
            { ...smhiForecastHour, dt: windowStart, precipitation: { amount: 3.0, hours_measured: 3, type: 'rain' } },
          ],
        },
      });
      // WeatherAPI: all three hours, 1 mm each — also 1 mm/h
      weatherApiDtoMocks.forecastWeather.mockReturnValue({
        ...weatherApiNormalizedForecast,
        list: {
          Monday: [hourly(windowStart, 1.0), hourly(windowStart + 3600, 1.0), hourly(windowStart + 7200, 1.0)],
        },
      });
      // MET: only the first hour of the window — 1 mm over 1 h, still 1 mm/h,
      // but its raw total is a third of the others'
      metDtoMocks.forecastWeather.mockReturnValue({
        ...metNormalizedForecast,
        list: {
          Monday: [
            { ...yrForecastHour, dt: windowStart, precipitation: { amount: 1.0, hours_measured: 1, type: 'rain' } },
          ],
        },
      });

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);
      const total = result.list.Monday.reduce((sum, h) => sum + h.precipitation.amount, 0);

      // Every source predicts 1 mm/h, so the window total is 3 mm. Averaging
      // raw totals instead would give (3 + 3 + 1) / 3 = 2.33 mm — MET's short
      // coverage read as a lower forecast rather than a partial one.
      expect(result.list.Monday).toHaveLength(3);
      expect(total).toBeCloseTo(3.0);
      expect(result.list.Monday.every(h => h.precipitation.hours_measured === 1)).toBe(true);
    });

    it("keeps a window's total intact when only coarse providers cover it", async () => {
      const windowStart = Math.ceil((Math.floor(Date.now() / 1000) + 86400) / 10800) * 10800;

      // Both providers forecast 1 mm/h, but each reports it as one coarse
      // period, so the window holds fewer merged entries than it has hours.
      smhiDtoMocks.forecastWeather.mockReturnValue({
        ...smhiNormalizedForecast,
        list: {
          Monday: [
            { ...smhiForecastHour, dt: windowStart, precipitation: { amount: 3.0, hours_measured: 3, type: 'rain' } },
          ],
        },
      });
      metDtoMocks.forecastWeather.mockReturnValue({
        ...metNormalizedForecast,
        list: {
          Monday: [
            {
              ...yrForecastHour,
              dt: windowStart + 3600,
              precipitation: { amount: 3.0, hours_measured: 3, type: 'rain' },
            },
          ],
        },
      });
      weatherApiDtoMocks.forecastWeather.mockReturnValue({ ...weatherApiNormalizedForecast, list: {} });

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);
      const hours = result.list.Monday;
      const total = hours.reduce((sum, h) => sum + h.precipitation.amount, 0);

      // 1 mm/h across a 3 h window is 3 mm however few timestamps carry it;
      // the two entries split the window and say so via hours_measured.
      expect(hours).toHaveLength(2);
      expect(total).toBeCloseTo(3.0);
      expect(hours.every(h => h.precipitation.hours_measured === 1.5)).toBe(true);
    });

    it("labels redistributed rain with a type even where the hourly source said 'none'", async () => {
      const windowStart = Math.ceil((Math.floor(Date.now() / 1000) + 86400) / 10800) * 10800;
      const dry = dt => ({
        ...weatherApiForecastHour,
        dt,
        precipitation: { amount: 0, hours_measured: 1, type: 'none' },
      });

      // SMHI brings 3 mm of rain into the window; WeatherAPI predicts a dry
      // window, so every merged entry inherits its 'none'
      smhiDtoMocks.forecastWeather.mockReturnValue({
        ...smhiNormalizedForecast,
        list: {
          Monday: [
            { ...smhiForecastHour, dt: windowStart, precipitation: { amount: 3.0, hours_measured: 3, type: 'rain' } },
          ],
        },
      });
      weatherApiDtoMocks.forecastWeather.mockReturnValue({
        ...weatherApiNormalizedForecast,
        list: { Monday: [dry(windowStart), dry(windowStart + 3600), dry(windowStart + 7200)] },
      });
      metDtoMocks.forecastWeather.mockReturnValue({ ...metNormalizedForecast, list: {} });

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      // (1 + 0) / 2 = 0.5 mm/h spread evenly — and it is rain, not 'none'
      for (const hour of result.list.Monday) {
        expect(hour.precipitation.amount).toBeCloseTo(0.5);
        expect(hour.precipitation.type).toBe('rain');
      }
    });

    it("marks an entry that receives no share of the window's rain as 'none'", async () => {
      const windowStart = Math.ceil((Math.floor(Date.now() / 1000) + 86400) / 10800) * 10800;
      const hourly = (dt, amount, type) => ({
        ...weatherApiForecastHour,
        dt,
        precipitation: { amount, hours_measured: 1, type },
      });

      smhiDtoMocks.forecastWeather.mockReturnValue({
        ...smhiNormalizedForecast,
        list: {
          Monday: [
            { ...smhiForecastHour, dt: windowStart, precipitation: { amount: 3.0, hours_measured: 3, type: 'rain' } },
          ],
        },
      });
      weatherApiDtoMocks.forecastWeather.mockReturnValue({
        ...weatherApiNormalizedForecast,
        list: {
          Monday: [
            hourly(windowStart, 3.0, 'rain'),
            hourly(windowStart + 3600, 0, 'none'),
            hourly(windowStart + 7200, 0, 'none'),
          ],
        },
      });
      metDtoMocks.forecastWeather.mockReturnValue({ ...metNormalizedForecast, list: {} });

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);
      const [first, second, third] = result.list.Monday;

      // WeatherAPI's pattern puts all of the window's 3 mm in the first hour
      expect(first.precipitation).toMatchObject({ amount: 3.0, type: 'rain' });
      expect(second.precipitation).toMatchObject({ amount: 0, type: 'none' });
      expect(third.precipitation).toMatchObject({ amount: 0, type: 'none' });
    });

    describe('windows straddling a local day boundary', () => {
      // Real DTOs key days by ISO date in the location's timezone, while
      // precipitation windows sit on the UTC grid. At UTC+2 the local day
      // starts at 22:00 UTC, inside the 21–24 UTC window — the window every
      // Nordic location's day begins and ends in.
      const TZ_OFFSET_HOURS = 2;
      const hourly = (dt, amount) => ({
        ...weatherApiForecastHour,
        dt,
        precipitation: { amount, hours_measured: 1, type: 'rain' },
      });
      const coarse = (dt, amount) => ({
        ...smhiForecastHour,
        dt,
        precipitation: { amount, hours_measured: 3, type: 'rain' },
      });
      const byDay = entries => {
        const list = {};
        for (const entry of entries) {
          const day = translateEpochDate(entry.dt, TZ_OFFSET_HOURS);
          list[day] ??= [];
          list[day].push(entry);
        }
        return list;
      };

      beforeEach(() => {
        // The aggregator takes its timezone from the raw WeatherAPI response.
        // Etc/GMT-2 is a fixed UTC+2 (POSIX flips the sign), so the offset
        // never drifts with DST the way a city zone would.
        weatherApiServiceMocks.forecastWeather.mockResolvedValue({ location: { tz_id: 'Etc/GMT-2' } });
        metDtoMocks.forecastWeather.mockReturnValue({ ...metNormalizedForecast, list: {} });
      });

      it("does not count the straddling window's rain in both days", async () => {
        // Two whole local days, a couple of days out: 1 mm/h from WeatherAPI
        // and 3 mm per 3 h from SMHI on the UTC grid — both say 1 mm/h all day
        const utcMidnight = Math.ceil((Math.floor(Date.now() / 1000) + 2 * 86400) / 86400) * 86400;
        const localDayStart = utcMidnight - TZ_OFFSET_HOURS * 3600;
        const waHours = [];
        const smhiHours = [];
        for (let t = localDayStart; t < localDayStart + 2 * 86400; t += 3600) {
          waHours.push(hourly(t, 1.0));
          if (t % 10800 === 0) smhiHours.push(coarse(t, 3.0));
        }
        smhiDtoMocks.forecastWeather.mockReturnValue({ ...smhiNormalizedForecast, list: byDay(smhiHours) });
        weatherApiDtoMocks.forecastWeather.mockReturnValue({ ...weatherApiNormalizedForecast, list: byDay(waHours) });

        const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);
        const days = Object.values(result.list);

        expect(days).toHaveLength(2);
        for (const hours of days) {
          const total = hours.reduce((sum, h) => sum + h.precipitation.amount, 0);
          // 24 hours at 1 mm/h. Scaling the 21–24 UTC window to its full width
          // in both days used to make this 27.
          expect(hours).toHaveLength(24);
          expect(total).toBeCloseTo(24.0);
          expect(hours.every(h => h.precipitation.hours_measured === 1)).toBe(true);
        }
      });

      it("only lets today's entries stand for the hours still ahead", async () => {
        // Pin the clock mid-window: 13:30 UTC, so the 12–15 window has one
        // future slot (14:00). The window after it is fully in the future.
        const base = Math.ceil((Math.floor(Date.now() / 1000) + 2 * 86400) / 86400) * 86400;
        const fakeNow = base + 13 * 3600 + 1800;
        jest.useFakeTimers({ now: fakeNow * 1000 });
        try {
          const first = base + 14 * 3600;
          smhiDtoMocks.forecastWeather.mockReturnValue({
            ...smhiNormalizedForecast,
            list: byDay([coarse(base + 15 * 3600, 3.0)]),
          });
          weatherApiDtoMocks.forecastWeather.mockReturnValue({
            ...weatherApiNormalizedForecast,
            list: byDay([
              hourly(first, 1.0),
              hourly(first + 3600, 1.0),
              hourly(first + 7200, 1.0),
              hourly(first + 10800, 1.0),
            ]),
          });

          const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);
          const [today] = Object.values(result.list);
          const total = today.reduce((sum, h) => sum + h.precipitation.amount, 0);

          // 14:00 is one remaining hour of its window, not three
          expect(today[0].precipitation).toMatchObject({ amount: 1.0, hours_measured: 1 });
          expect(total).toBeCloseTo(4.0);
        } finally {
          jest.useRealTimers();
        }
      });
    });

    it('preserves days that only one provider has data for', async () => {
      smhiDtoMocks.forecastWeather.mockReturnValue({
        ...smhiNormalizedForecast,
        list: {
          ...smhiNormalizedForecast.list,
          Tuesday: [
            {
              ...smhiForecastHour,
              dt: FUTURE_DT + 86400,
              precipitation: { amount: 1.0, hours_measured: 3, type: 'rain' },
            },
          ],
        },
      });

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      expect(result.list).toHaveProperty('Monday');
      expect(result.list).toHaveProperty('Tuesday');
    });

    it('returns SMHI and Yr forecast with an error entry when WeatherAPI fails', async () => {
      weatherApiServiceMocks.forecastWeather.mockRejectedValue(new Error('WeatherAPI down'));

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      expect(result.list).toHaveProperty('Monday');
      expect(result.providers).toEqual(expect.arrayContaining(['smhi.se', 'met.no']));
      expect(result.providers).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].provider).toBe('weatherapi.com');
    });

    it('returns WeatherAPI and Yr forecast with an error entry when SMHI fails', async () => {
      smhiServiceMocks.forecastWeather.mockRejectedValue(new Error('SMHI down'));

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      expect(result.list).toHaveProperty('Monday');
      expect(result.providers).toEqual(expect.arrayContaining(['weatherapi.com', 'met.no']));
      expect(result.providers).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].provider).toBe('smhi.se');
    });

    it('returns WeatherAPI and SMHI forecast with an error entry when Yr fails', async () => {
      metServiceMocks.forecastWeather.mockRejectedValue(new Error('Yr down'));

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      expect(result.list).toHaveProperty('Monday');
      expect(result.providers).toEqual(expect.arrayContaining(['weatherapi.com', 'smhi.se']));
      expect(result.providers).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].provider).toBe('met.no');
    });

    it('returns an error structure when all forecast providers fail', async () => {
      weatherApiServiceMocks.forecastWeather.mockRejectedValue(new Error('WeatherAPI down'));
      smhiServiceMocks.forecastWeather.mockRejectedValue(new Error('SMHI down'));
      metServiceMocks.forecastWeather.mockRejectedValue(new Error('Yr down'));

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      expect(result.error).toBe('All weather providers failed');
      expect(result.errors).toHaveLength(3);
    });

    describe('output field rounding', () => {
      const makeForecastHour = overrides => ({
        dt: FUTURE_DT,
        weather: 'Clouds',
        description: 'overcast clouds',
        icon: null,
        temperature: { temp: 10.0, feels_like: 9.0, max: null, min: null },
        pressure: 1010,
        humidity: 80,
        visibility: 10000,
        elevation: { sea_level: null, ground_level: null },
        wind: { speed: 4.0, deg: 180, dir: null, gust: null },
        clouds: { all: 50 },
        precipitation: { amount: 0.0, hours_measured: 1, type: 'none' },
        ...overrides,
      });

      it('rounds forecast temperature fields to the nearest integer', async () => {
        // temp avg: (7.2 + 8.3 + 7.8) / 3 = 7.77 → 8
        weatherApiDtoMocks.forecastWeather.mockReturnValue({
          list: { Monday: [makeForecastHour({ temperature: { temp: 7.2, feels_like: 6.3, max: null, min: null } })] },
          provider: 'weatherapi.com',
        });
        smhiDtoMocks.forecastWeather.mockReturnValue({
          list: { Monday: [makeForecastHour({ temperature: { temp: 8.3, feels_like: null, max: null, min: null } })] },
          provider: 'smhi.se',
        });
        metDtoMocks.forecastWeather.mockReturnValue({
          list: { Monday: [makeForecastHour({ temperature: { temp: 7.8, feels_like: null, max: null, min: null } })] },
          provider: 'met.no',
        });

        const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);
        const hour = result.list.Monday[0];

        expect(Number.isInteger(hour.temperature.temp)).toBe(true);
        expect(Number.isInteger(hour.temperature.feels_like)).toBe(true);
      });

      it('rounds forecast pressure and visibility to the nearest integer', async () => {
        // pressure: (1023.7 + 1016.2 + 1018.5) / 3 = 1019.47 → 1019
        // visibility: (8000 + 11500 + 10000) / 3 = 9833.33 → 9833
        weatherApiDtoMocks.forecastWeather.mockReturnValue({
          list: { Monday: [makeForecastHour({ pressure: 1023.7, visibility: 8000 })] },
          provider: 'weatherapi.com',
        });
        smhiDtoMocks.forecastWeather.mockReturnValue({
          list: { Monday: [makeForecastHour({ pressure: 1016.2, visibility: 11500 })] },
          provider: 'smhi.se',
        });
        metDtoMocks.forecastWeather.mockReturnValue({
          list: { Monday: [makeForecastHour({ pressure: 1018.5, visibility: 10000 })] },
          provider: 'met.no',
        });

        const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);
        const hour = result.list.Monday[0];

        expect(Number.isInteger(hour.pressure)).toBe(true);
        expect(Number.isInteger(hour.visibility)).toBe(true);
        expect(hour.visibility).toBe(9833);
      });

      it('rounds forecast clouds.all to the nearest integer', async () => {
        // (33 + 50 + 66) / 3 = 49.67 → 50
        weatherApiDtoMocks.forecastWeather.mockReturnValue({
          list: { Monday: [makeForecastHour({ clouds: { all: 33 } })] },
          provider: 'weatherapi.com',
        });
        smhiDtoMocks.forecastWeather.mockReturnValue({
          list: { Monday: [makeForecastHour({ clouds: { all: 50 } })] },
          provider: 'smhi.se',
        });
        metDtoMocks.forecastWeather.mockReturnValue({
          list: { Monday: [makeForecastHour({ clouds: { all: 66 } })] },
          provider: 'met.no',
        });

        const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);
        const hour = result.list.Monday[0];

        expect(Number.isInteger(hour.clouds.all)).toBe(true);
        expect(hour.clouds.all).toBe(50);
      });

      it('rounds forecast wind.speed and wind.gust to at most 2 decimal places', async () => {
        // speed: (8.5678 + 2.8765 + 3.1111) / 3 = 4.8518 → 4.85
        // gust:  (16.6789 + 2.8765) / 2 = 9.7777 → 9.78
        weatherApiDtoMocks.forecastWeather.mockReturnValue({
          list: { Monday: [makeForecastHour({ wind: { speed: 8.5678, deg: 46, dir: 'NE', gust: 16.6789 } })] },
          provider: 'weatherapi.com',
        });
        smhiDtoMocks.forecastWeather.mockReturnValue({
          list: { Monday: [makeForecastHour({ wind: { speed: 2.8765, deg: 76, dir: null, gust: 2.8765 } })] },
          provider: 'smhi.se',
        });
        metDtoMocks.forecastWeather.mockReturnValue({
          list: { Monday: [makeForecastHour({ wind: { speed: 3.1111, deg: 76, dir: null, gust: null } })] },
          provider: 'met.no',
        });

        const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);
        const hour = result.list.Monday[0];

        const speedDecimals = (hour.wind.speed.toString().split('.')[1] ?? '').length;
        const gustDecimals = (hour.wind.gust.toString().split('.')[1] ?? '').length;
        expect(speedDecimals).toBeLessThanOrEqual(2);
        expect(gustDecimals).toBeLessThanOrEqual(2);
        expect(hour.wind.speed).toBe(4.85);
        expect(hour.wind.gust).toBe(9.78);
      });

      it('rounds forecast precipitation.amount to at most 2 decimal places', async () => {
        // hourly rates: 1.8888, 2.1111, 0.5555 → avg = 1.518466… → 1.52
        weatherApiDtoMocks.forecastWeather.mockReturnValue({
          list: { Monday: [makeForecastHour({ precipitation: { amount: 1.8888, hours_measured: 1, type: 'rain' } })] },
          provider: 'weatherapi.com',
        });
        smhiDtoMocks.forecastWeather.mockReturnValue({
          list: { Monday: [makeForecastHour({ precipitation: { amount: 2.1111, hours_measured: 1, type: 'rain' } })] },
          provider: 'smhi.se',
        });
        metDtoMocks.forecastWeather.mockReturnValue({
          list: { Monday: [makeForecastHour({ precipitation: { amount: 0.5555, hours_measured: 1, type: 'rain' } })] },
          provider: 'met.no',
        });

        const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);
        const hour = result.list.Monday[0];

        const decimals = (hour.precipitation.amount.toString().split('.')[1] ?? '').length;
        expect(decimals).toBeLessThanOrEqual(2);
        expect(hour.precipitation.amount).toBe(1.52);
      });
    });

    it('preserves all hourly timeslots from providers through the merge', async () => {
      const now = Math.floor(Date.now() / 1000);
      const hour0 = now + 3600;
      const hour1 = now + 7200;
      const hour2 = now + 10800;

      const makeHour = dt => ({
        dt,
        weather: 'Clouds',
        description: 'overcast clouds',
        icon: null,
        temperature: { temp: 10.0, feels_like: 9.0, max: null, min: null },
        pressure: 1010,
        humidity: 80,
        visibility: 10000,
        elevation: { sea_level: null, ground_level: null },
        wind: { speed: 4.0, deg: 220, dir: null, gust: null },
        clouds: { all: 100 },
        precipitation: { amount: 0, hours_measured: 1, type: 'none' },
      });

      weatherApiDtoMocks.forecastWeather.mockReturnValue({
        list: { Monday: [makeHour(hour0), makeHour(hour1), makeHour(hour2)] },
        provider: 'weatherapi.com',
      });
      smhiDtoMocks.forecastWeather.mockReturnValue({
        list: { Monday: [makeHour(hour0), makeHour(hour1)] },
        provider: 'smhi.se',
      });
      metDtoMocks.forecastWeather.mockReturnValue({
        list: { Monday: [makeHour(hour0), makeHour(hour1), makeHour(hour2)] },
        provider: 'met.no',
      });

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      expect(result.list.Monday).toHaveLength(3);
      expect(result.list.Monday[0].dt).toBe(hour0);
      expect(result.list.Monday[1].dt).toBe(hour1);
      expect(result.list.Monday[2].dt).toBe(hour2);
      expect(result.list.Monday[1].dt - result.list.Monday[0].dt).toBe(3600);
      expect(result.list.Monday[2].dt - result.list.Monday[1].dt).toBe(3600);
    });

    it('excludes timeslots that have already happened', async () => {
      const now = Math.floor(Date.now() / 1000);
      const pastDt = now - 3600;
      const futureDt = now + 3600;

      const makeHour = dt => ({
        dt,
        weather: 'Clouds',
        description: null,
        icon: null,
        temperature: { temp: 10.0, feels_like: null, max: null, min: null },
        pressure: 1010,
        humidity: 80,
        visibility: null,
        elevation: { sea_level: null, ground_level: null },
        wind: { speed: 4.0, deg: 220, dir: null, gust: null },
        clouds: { all: 50 },
        precipitation: { amount: 0, hours_measured: 1, type: 'none' },
      });

      weatherApiDtoMocks.forecastWeather.mockReturnValue({
        list: { Monday: [makeHour(pastDt), makeHour(futureDt)] },
        provider: 'weatherapi.com',
      });
      smhiDtoMocks.forecastWeather.mockReturnValue({
        list: { Monday: [makeHour(pastDt), makeHour(futureDt)] },
        provider: 'smhi.se',
      });
      metDtoMocks.forecastWeather.mockReturnValue({
        list: { Monday: [makeHour(pastDt), makeHour(futureDt)] },
        provider: 'met.no',
      });

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);
      const allDts = Object.values(result.list)
        .flat()
        .map(h => h.dt);

      expect(allDts).not.toContain(pastDt);
      expect(allDts).toContain(futureDt);
    });
  });
  describe('allWeather', () => {
    beforeEach(() => {
      weatherApiDtoMocks.forecastWeather.mockReturnValue(weatherApiNormalizedForecast);
      smhiDtoMocks.forecastWeather.mockReturnValue(smhiNormalizedForecast);
      metDtoMocks.forecastWeather.mockReturnValue(metNormalizedForecast);
    });

    it('returns both currentWeather and forecastWeather', async () => {
      const result = await weatherAggregatorService.allWeather(59.4, 18.0);

      expect(result).toHaveProperty('currentWeather');
      expect(result).toHaveProperty('forecastWeather');
    });

    it('calls smhiService.forecastWeather exactly once', async () => {
      smhiServiceMocks.forecastWeather.mockClear();

      await weatherAggregatorService.allWeather(59.4, 18.0);

      expect(smhiServiceMocks.forecastWeather).toHaveBeenCalledTimes(1);
    });

    it('calls metService.forecastWeather exactly once', async () => {
      metServiceMocks.forecastWeather.mockClear();

      await weatherAggregatorService.allWeather(59.4, 18.0);

      expect(metServiceMocks.forecastWeather).toHaveBeenCalledTimes(1);
    });

    it('currentWeather averages data from all three providers', async () => {
      const result = await weatherAggregatorService.allWeather(59.4, 18.0);

      expect(result.currentWeather.temperature.temp).toBeCloseTo(8.0);
      expect(result.currentWeather.humidity).toBeCloseTo(75);
      expect(result.currentWeather.providers).toEqual(expect.arrayContaining(['weatherapi.com', 'smhi.se', 'met.no']));
    });

    it('forecastWeather merges data from all three providers', async () => {
      const result = await weatherAggregatorService.allWeather(59.4, 18.0);

      expect(result.forecastWeather.list).toHaveProperty('Monday');
      expect(result.forecastWeather.providers).toEqual(expect.arrayContaining(['weatherapi.com', 'smhi.se', 'met.no']));
    });

    it('hands the one WeatherAPI forecast payload to the current DTO as well, for sunrise/sunset', async () => {
      const currentPayload = { location: { tz_id: 'Europe/Stockholm' } };
      const forecastPayload = { forecast: { forecastday: [] } };
      weatherApiServiceMocks.currentWeather.mockResolvedValue(currentPayload);
      weatherApiServiceMocks.forecastWeather.mockResolvedValue(forecastPayload);
      weatherApiServiceMocks.forecastWeather.mockClear();

      await weatherAggregatorService.allWeather(59.4, 18.0);

      expect(weatherApiServiceMocks.forecastWeather).toHaveBeenCalledTimes(1);
      expect(weatherApiDtoMocks.currentWeather).toHaveBeenCalledWith(currentPayload, true, forecastPayload);
    });

    it('hands the current DTO null for the forecast payload when that call failed', async () => {
      const currentPayload = { location: { tz_id: 'Europe/Stockholm' } };
      weatherApiServiceMocks.currentWeather.mockResolvedValue(currentPayload);
      weatherApiServiceMocks.forecastWeather.mockRejectedValue(new Error('WeatherAPI forecast down'));

      const result = await weatherAggregatorService.allWeather(59.4, 18.0);

      expect(weatherApiDtoMocks.currentWeather).toHaveBeenCalledWith(currentPayload, true, null);
      expect(result.currentWeather.providers).toContain('weatherapi.com');
    });

    it('propagates SMHI failure to both currentWeather and forecastWeather errors', async () => {
      smhiServiceMocks.forecastWeather.mockRejectedValue(new Error('SMHI down'));

      const result = await weatherAggregatorService.allWeather(59.4, 18.0);

      expect(result.currentWeather.errors).toHaveLength(1);
      expect(result.currentWeather.errors[0].provider).toBe('smhi.se');
      expect(result.forecastWeather.errors).toHaveLength(1);
      expect(result.forecastWeather.errors[0].provider).toBe('smhi.se');
    });

    it('propagates Yr failure to both currentWeather and forecastWeather errors', async () => {
      metServiceMocks.forecastWeather.mockRejectedValue(new Error('Yr down'));

      const result = await weatherAggregatorService.allWeather(59.4, 18.0);

      expect(result.currentWeather.errors).toHaveLength(1);
      expect(result.currentWeather.errors[0].provider).toBe('met.no');
      expect(result.forecastWeather.errors).toHaveLength(1);
      expect(result.forecastWeather.errors[0].provider).toBe('met.no');
    });

    it('currentWeather and forecastWeather errors are independent when different providers fail', async () => {
      // WeatherAPI's current call fails while its forecast call succeeds;
      // SMHI's single response normalizes for current but not for forecast
      weatherApiServiceMocks.currentWeather.mockRejectedValue(new Error('WeatherAPI current down'));
      smhiDtoMocks.forecastWeather.mockReturnValue(null);

      const result = await weatherAggregatorService.allWeather(59.4, 18.0);

      expect(result.currentWeather.errors).toHaveLength(1);
      expect(result.currentWeather.errors[0].provider).toBe('weatherapi.com');
      expect(result.forecastWeather.errors).toHaveLength(1);
      expect(result.forecastWeather.errors[0].provider).toBe('smhi.se');
    });

    describe('snapshot timezone', () => {
      // The accuracy snapshot buckets SMHI/MET by the timezone it is handed,
      // so it must get the same one the forecast merge used — never a UTC
      // fallback while the response itself was bucketed locally
      beforeEach(() => {
        captureForecastsMock.mockClear();
      });

      const snapshotTimezone = () => captureForecastsMock.mock.calls[0][3];

      it("prefers the current-weather response's timezone", async () => {
        weatherApiServiceMocks.currentWeather.mockResolvedValue({ location: { tz_id: 'Europe/Stockholm' } });
        weatherApiServiceMocks.forecastWeather.mockResolvedValue({ location: { tz_id: 'Europe/Oslo' } });

        await weatherAggregatorService.allWeather(59.4, 18.0);

        expect(snapshotTimezone()).toBe('Europe/Stockholm');
      });

      it("falls back to the forecast response's timezone when the current call fails", async () => {
        weatherApiServiceMocks.currentWeather.mockRejectedValue(new Error('WeatherAPI current down'));
        weatherApiServiceMocks.forecastWeather.mockResolvedValue({ location: { tz_id: 'Europe/Oslo' } });

        await weatherAggregatorService.allWeather(59.4, 18.0);

        expect(snapshotTimezone()).toBe('Europe/Oslo');
      });

      it('falls back to UTC only when WeatherAPI gave no timezone at all', async () => {
        weatherApiServiceMocks.currentWeather.mockRejectedValue(new Error('WeatherAPI current down'));
        weatherApiServiceMocks.forecastWeather.mockRejectedValue(new Error('WeatherAPI forecast down'));

        await weatherAggregatorService.allWeather(59.4, 18.0);

        expect(snapshotTimezone()).toBe('UTC');
      });
    });
  });
});
