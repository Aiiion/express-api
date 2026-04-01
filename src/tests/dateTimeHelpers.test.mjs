import { translateEpochDay, translateEpochTime } from "../utils/dateTimeHelpers.mjs";

// 2025-11-06 00:00:00 UTC → Thursday
// UTC+9 (32400s) → 2025-11-06 09:00 JST → still Thursday
// UTC-5 (-18000s) → 2025-11-05 19:00 EST → Wednesday
// The epoch 1762387200 = 2025-11-06 00:00:00 UTC (a Thursday)
const THURSDAY_UTC_MIDNIGHT_EPOCH = 1762387200;

describe('translateEpochDay', () => {
  it('returns the correct day using a numeric UTC offset (seconds)', () => {
    // UTC+9: 2025-11-06 09:00 JST → Thursday
    expect(translateEpochDay(THURSDAY_UTC_MIDNIGHT_EPOCH, 32400)).toBe('Thursday');
  });

  it('returns the previous day when negative offset pushes date back', () => {
    // UTC-5: 2025-11-05 19:00 EST → Wednesday
    expect(translateEpochDay(THURSDAY_UTC_MIDNIGHT_EPOCH, -18000)).toBe('Wednesday');
  });

  it('returns the correct day using an IANA timezone string', () => {
    // "Asia/Tokyo" is UTC+9 → Thursday
    expect(translateEpochDay(THURSDAY_UTC_MIDNIGHT_EPOCH, 'Asia/Tokyo')).toBe('Thursday');
  });

  it('returns the previous day for a western IANA timezone', () => {
    // "America/New_York" is UTC-5 in November → Wednesday
    expect(translateEpochDay(THURSDAY_UTC_MIDNIGHT_EPOCH, 'America/New_York')).toBe('Wednesday');
  });

  it('falls back gracefully when no timezone is provided', () => {
    const result = translateEpochDay(THURSDAY_UTC_MIDNIGHT_EPOCH);
    expect(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).toContain(result);
  });
});

describe('translateEpochTime', () => {
  it('returns correct time using a numeric UTC offset', () => {
    // THURSDAY_UTC_MIDNIGHT_EPOCH = 2025-11-06 00:00 UTC
    // UTC+9 → 09:00
    expect(translateEpochTime(THURSDAY_UTC_MIDNIGHT_EPOCH, 32400)).toBe('09:00');
  });

  it('returns correct time using a negative numeric UTC offset', () => {
    // UTC-5 → previous day 19:00
    expect(translateEpochTime(THURSDAY_UTC_MIDNIGHT_EPOCH, -18000)).toBe('19:00');
  });

  it('returns correct time using an IANA timezone string', () => {
    // "Asia/Tokyo" UTC+9 → 09:00
    expect(translateEpochTime(THURSDAY_UTC_MIDNIGHT_EPOCH, 'Asia/Tokyo')).toBe('09:00');
  });

  it('pads single-digit minutes with a leading zero', () => {
    // 1762387260 = 2025-11-06 00:01:00 UTC → UTC+9 → 09:01
    expect(translateEpochTime(1762387260, 32400)).toBe('09:01');
  });

  it('falls back gracefully when no timezone is provided', () => {
    const result = translateEpochTime(THURSDAY_UTC_MIDNIGHT_EPOCH);
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});
