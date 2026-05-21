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
      hour12: false
    });
    const timeParts = timeStr.match(/(\d{2}):(\d{2})/);
    if (timeParts) return `${timeParts[1]}:${timeParts[2]}`;
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