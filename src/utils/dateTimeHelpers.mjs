// Returns the local calendar date (YYYY-MM-DD) for a given epoch in the specified timezone.
// Using an ISO date string as the grouping key prevents weekday-name collisions when
// providers supply forecasts that span two occurrences of the same weekday (e.g. next Sunday).
export const translateEpochDate = (epoch, timezone) => {
  const date = new Date(epoch * 1000);

  if (typeof timezone === 'string') {
    // en-CA locale produces "YYYY-MM-DD" which sorts lexicographically
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  if (typeof timezone === 'number') {
    const adjusted = new Date(date.getTime() + timezone * 3_600_000);
    return adjusted.toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
};

//translated the epoch value to the weekday of the date
export const translateEpochDay = (epoch, timezone) => {
  const date = new Date(epoch * 1000);

  if (typeof timezone === 'string') {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: timezone }).format(date);
  }

  if (typeof timezone === 'number') {
    const adjusted = new Date(date.getTime() + timezone * 3_600_000);
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(adjusted);
  }

  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
};

//translates the epoch value to time in hours and minutes
export const translateEpochTime = (epoch, timezone) => {
  const date = new Date(epoch * 1000);

  if (typeof timezone === 'string') {
    const timeStr = date.toLocaleString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      hourCycle: 'h23',
    });
    const timeParts = timeStr.match(/(\d{2}):(\d{2})/);
    if (timeParts) return `${timeParts[1]}:${timeParts[2]}`;
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  if (typeof timezone === 'number') {
    const adjusted = new Date(date.getTime() + timezone * 3_600_000);
    const h = String(adjusted.getUTCHours()).padStart(2, '0');
    const m = String(adjusted.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

// Offset of `timezone` from UTC in milliseconds at the given instant (positive east of UTC)
const timezoneOffsetMs = (utcMs, timezone) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = type => Number(parts.find(p => p.type === type)?.value);
  const wallClockAsUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return wallClockAsUtc - Math.floor(utcMs / 1000) * 1000;
};

// Returns the epoch (seconds) of a wall-clock time — a "YYYY-MM-DD" date plus hours and
// minutes — read in the given timezone. The inverse of translateEpochDate/translateEpochTime,
// for providers that report a moment as local clock text rather than as a timestamp.
export const localTimeToEpoch = (isoDate, hours, minutes, timezone) => {
  const [year, month, day] = String(isoDate).split('-').map(Number);
  const wallClock = Date.UTC(year, month - 1, day, hours, minutes);
  if (!Number.isFinite(wallClock)) return null;

  if (typeof timezone === 'number') {
    return Math.floor((wallClock - timezone * 3_600_000) / 1000);
  }

  if (typeof timezone === 'string') {
    // Treat the wall clock as UTC for a first guess and correct it by the zone's offset at
    // that guess; a second pass settles guesses that landed on the far side of a DST switch
    let instant = wallClock - timezoneOffsetMs(wallClock, timezone);
    instant = wallClock - timezoneOffsetMs(instant, timezone);
    return Math.floor(instant / 1000);
  }

  return Math.floor(wallClock / 1000);
};
