//translated the epoch value to the weekday of the date
export const translateEpochDay = (epoch) => {
  let newDate = new Date(epoch * 1000);

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
export const translateEpochTime = (epoch) => {
  let date = new Date(epoch * 1000);
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