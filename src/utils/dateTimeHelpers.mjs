//translated the epoch value to the weekday of the date
export const translateEpochDay = (epoch, timezone) => {
  let newDate = new Date(epoch * 1000);
  
  // Apply timezone if provided
  if (timezone !== undefined) {
    if (typeof timezone === 'string') {
      return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: timezone }).format(new Date(epoch * 1000));
    } else if (typeof timezone === 'number') {
      // Handle timezone as UTC offset in hours
      const utcTime = newDate.getTime();
      const offsetMs = timezone * 60 * 60 * 1000;
      newDate = new Date(utcTime + offsetMs + (newDate.getTimezoneOffset() * 60 * 1000));
    }
  }

  switch (newDate.getDay()) {
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
export const translateEpochTime = (epoch, timezone) => {
  let date = new Date(epoch * 1000);
  
  // Apply timezone if provided
  if (timezone !== undefined) {
    if (typeof timezone === 'string') {
      // Handle timezone string like "Europe/Stockholm"
      const timeStr = date.toLocaleString('en-US', { 
        timeZone: timezone, 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
      // Extract HH:MM from the formatted string
      const timeParts = timeStr.match(/(\d{2}):(\d{2})/);
      if (timeParts) {
        return `${timeParts[1]}:${timeParts[2]}`;
      }
    } else if (typeof timezone === 'number') {
      // Handle timezone as UTC offset in hours
      const utcTime = date.getTime();
      const offsetMs = timezone * 60 * 60 * 1000;
      date = new Date(utcTime + offsetMs + (date.getTimezoneOffset() * 60 * 1000));
    }
  }
  
  let hour = date.getHours();
  let minute = date.getMinutes();
  if (minute < 10) {
    minute = `0${minute}`;
  }
  if (hour < 10) {
    hour = `0${hour}`;
  }
  return `${hour}:${minute}`;
};