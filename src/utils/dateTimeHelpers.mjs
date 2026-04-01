//translated the epoch value to the weekday of the date
//timezone can be an IANA timezone string (e.g. "Asia/Tokyo") or a UTC offset in seconds (e.g. 32400)
export const translateEpochDay = (epoch, timezone) => {
  if (typeof timezone === 'string') {
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: timezone }).format(new Date(epoch * 1000));
  }

  let dayIndex;
  if (typeof timezone === 'number') {
    dayIndex = new Date((epoch + timezone) * 1000).getUTCDay();
  } else {
    dayIndex = new Date(epoch * 1000).getDay();
  }

  switch (dayIndex) {
    case 1:
      return "Monday";
    case 2:
      return "Tuesday";
    case 3:
      return "Wednesday";
    case 4:
      return "Thursday";
    case 5:
      return "Friday";
    case 6:
      return "Saturday";
    case 0:
      return "Sunday";
    default:
      return "error";
  }
};
//translates the epoch value to time in hours and minutes
//timezone can be an IANA timezone string (e.g. "Asia/Tokyo") or a UTC offset in seconds (e.g. 32400)
export const translateEpochTime = (epoch, timezone) => {
  let hour, minute;

  if (typeof timezone === 'string') {
    // '2-digit' with hourCycle 'h23' already zero-pads both hour and minute
    const parts = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: timezone,
    }).formatToParts(new Date(epoch * 1000));
    hour = parts.find(p => p.type === 'hour')?.value ?? '00';
    minute = parts.find(p => p.type === 'minute')?.value ?? '00';
    return `${hour}:${minute}`;
  }

  let date;
  if (typeof timezone === 'number') {
    date = new Date((epoch + timezone) * 1000);
    hour = date.getUTCHours();
    minute = date.getUTCMinutes();
  } else {
    date = new Date(epoch * 1000);
    hour = date.getHours();
    minute = date.getMinutes();
  }

  if (minute < 10) {
    minute = `0${minute}`;
  }
  if (hour < 10) {
    hour = `0${hour}`;
  }
  return `${hour}:${minute}`;
};