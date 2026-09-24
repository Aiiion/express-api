import { jest } from '@jest/globals';
import weatherApiDto from '../dtos/weatherApi.dto.mjs';
import { weather as weatherApiWeather } from '../fixtures/weatherApi.fixture.mjs';
import { localTimeToEpoch, translateEpochDate, translateEpochTime } from '../utils/dateTimeHelpers.mjs';

const TZ = 'Europe/Stockholm';

// A forecast.json payload whose first day is the location's current local date, as the
// real API returns it (the shared fixture only carries tomorrow)
const forecastWithAstro = (astro, timezone = TZ) => ({
  location: { tz_id: timezone },
  forecast: {
    forecastday: [
      { date: translateEpochDate(Math.floor(Date.now() / 1000), timezone), astro },
      { date: '2099-01-01', astro: { sunrise: '01:00 AM', sunset: '01:00 PM' } },
    ],
  },
});

const current = () => weatherApiWeather.data;

describe('localTimeToEpoch', () => {
  it('reads a wall-clock time in a named zone (standard time)', () => {
    // CET is UTC+1 in January
    expect(localTimeToEpoch('2026-01-15', 6, 14, TZ)).toBe(Date.UTC(2026, 0, 15, 5, 14) / 1000);
  });

  it('reads a wall-clock time in a named zone (daylight time)', () => {
    // CEST is UTC+2 in July
    expect(localTimeToEpoch('2026-07-15', 4, 30, TZ)).toBe(Date.UTC(2026, 6, 15, 2, 30) / 1000);
  });

  it('settles a time just before a DST switch on the pre-switch offset', () => {
    // Stockholm springs forward at 01:00 UTC on 2026-03-29; 01:30 local is still CET (+1)
    expect(localTimeToEpoch('2026-03-29', 1, 30, TZ)).toBe(Date.UTC(2026, 2, 29, 0, 30) / 1000);
  });

  it('works for zones west of UTC', () => {
    expect(localTimeToEpoch('2026-01-15', 7, 20, 'America/New_York')).toBe(Date.UTC(2026, 0, 15, 12, 20) / 1000);
  });

  it('accepts a numeric UTC offset in hours', () => {
    expect(localTimeToEpoch('2026-01-15', 6, 14, 1)).toBe(Date.UTC(2026, 0, 15, 5, 14) / 1000);
  });

  it('falls back to UTC without a timezone', () => {
    expect(localTimeToEpoch('2026-01-15', 6, 14)).toBe(Date.UTC(2026, 0, 15, 6, 14) / 1000);
  });

  it('returns null for an unparseable date', () => {
    expect(localTimeToEpoch('not-a-date', 6, 14, TZ)).toBeNull();
  });
});

describe('weatherApiDto.currentWeather sunrise/sunset', () => {
  // The fixture builder, the DTO and the assertions each read the clock on their own; a local
  // midnight between two of those reads would leave them looking for different days. A fixed
  // instant — midday in Stockholm, clear of a DST switch — keeps all three on one date.
  beforeAll(() => {
    jest.useFakeTimers({ now: Date.UTC(2026, 5, 15, 10, 0) });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("converts today's astro clock text into epochs in the location's timezone", () => {
    const result = weatherApiDto.currentWeather(
      current(),
      true,
      forecastWithAstro({ sunrise: '06:14 AM', sunset: '07:31 PM' }),
    );

    expect(typeof result.sunrise).toBe('number');
    expect(typeof result.sunset).toBe('number');
    // Round-trip through the independent formatters: same local day, same clock time
    const today = translateEpochDate(Math.floor(Date.now() / 1000), TZ);
    expect(translateEpochDate(result.sunrise, TZ)).toBe(today);
    expect(translateEpochTime(result.sunrise, TZ)).toBe('06:14');
    expect(translateEpochDate(result.sunset, TZ)).toBe(today);
    expect(translateEpochTime(result.sunset, TZ)).toBe('19:31');
    expect(result.sunset).toBeGreaterThan(result.sunrise);
  });

  it("handles the 12 o'clock edge of 12-hour clock text", () => {
    const result = weatherApiDto.currentWeather(
      current(),
      true,
      forecastWithAstro({ sunrise: '12:05 AM', sunset: '12:30 PM' }),
    );

    expect(translateEpochTime(result.sunrise, TZ)).toBe('00:05');
    expect(translateEpochTime(result.sunset, TZ)).toBe('12:30');
  });

  it('leaves a polar "No sunrise" / "No sunset" as null without losing the other', () => {
    const result = weatherApiDto.currentWeather(
      current(),
      true,
      forecastWithAstro({ sunrise: 'No sunrise', sunset: '01:12 PM' }),
    );

    expect(result.sunrise).toBeNull();
    expect(translateEpochTime(result.sunset, TZ)).toBe('13:12');
  });

  it('is null without a forecast payload', () => {
    const result = weatherApiDto.currentWeather(current());

    expect(result.sunrise).toBeNull();
    expect(result.sunset).toBeNull();
  });

  it("is null when the forecast does not cover the location's current day", () => {
    const forecast = forecastWithAstro({ sunrise: '06:14 AM', sunset: '07:31 PM' });
    forecast.forecast.forecastday.shift();

    const result = weatherApiDto.currentWeather(current(), true, forecast);

    expect(result.sunrise).toBeNull();
    expect(result.sunset).toBeNull();
  });

  it('is null without a timezone rather than guessing UTC', () => {
    const data = { ...current(), location: { ...current().location, tz_id: undefined } };
    const forecast = forecastWithAstro({ sunrise: '06:14 AM', sunset: '07:31 PM' });
    forecast.location.tz_id = undefined;

    const result = weatherApiDto.currentWeather(data, true, forecast);

    expect(result.sunrise).toBeNull();
    expect(result.sunset).toBeNull();
  });

  it('does not throw on an unknown timezone, so the rest of the source survives', () => {
    const data = { ...current(), location: { ...current().location, tz_id: 'Mars/Olympus_Mons' } };
    const forecast = forecastWithAstro({ sunrise: '06:14 AM', sunset: '07:31 PM' });

    const result = weatherApiDto.currentWeather(data, true, forecast);

    expect(result.sunrise).toBeNull();
    expect(result.temperature.temp).toBe(current().current.temp_c);
  });
});
