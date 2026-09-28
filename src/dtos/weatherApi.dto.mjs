import { localTimeToEpoch, translateEpochDate } from '../utils/dateTimeHelpers.mjs';
import { kphToMs } from '../utils/mathHelpers.mjs';
import { conditionFromWeatherApiCode } from '../utils/weatherConditions.mjs';

const getPrecipitationType = hour => {
  // Check for snow
  if (hour.snow_cm && hour.snow_cm > 0) {
    return 'snow';
  }
  // Check for rain (or any precipitation)
  if ((hour.precip_mm && hour.precip_mm > 0) || (hour.precip_in && hour.precip_in > 0)) {
    // Check condition text for specific types
    const conditionText = hour.condition?.text?.toLowerCase() || '';
    if (conditionText.includes('snow')) {
      return 'snow';
    }
    return 'rain';
  }
  return 'none';
};

// WeatherAPI writes astro times as local clock text, "06:14 AM"; above the polar
// circles it writes "No sunrise" / "No sunset" instead, which parses to null
const parseClockTime = text => {
  const match = /^(\d{1,2}):(\d{2})\s*([AP])M$/i.exec(String(text ?? '').trim());
  if (!match) return null;
  const hours = (Number(match[1]) % 12) + (match[3].toUpperCase() === 'P' ? 12 : 0);
  return { hours, minutes: Number(match[2]) };
};

// Sunrise and sunset never appear on current.json — WeatherAPI only reports them per
// forecast day (`astro`) — so the current DTO reads them off the forecast payload for
// the location's current local date and turns the clock text into epochs. Without a
// forecast payload, a timezone or a matching day the fields stay null.
const sunTimesFor = (current, forecast) => {
  const none = { sunrise: null, sunset: null };
  const timezone = current?.location?.tz_id ?? forecast?.location?.tz_id;
  if (!timezone) return none;
  try {
    const today = translateEpochDate(Math.floor(Date.now() / 1000), timezone);
    const astro = forecast?.forecast?.forecastday?.find(day => day?.date === today)?.astro;
    if (!astro) return none;
    const toEpoch = text => {
      const time = parseClockTime(text);
      return time ? localTimeToEpoch(today, time.hours, time.minutes, timezone) : null;
    };
    return { sunrise: toEpoch(astro.sunrise), sunset: toEpoch(astro.sunset) };
  } catch {
    // An unknown tz_id throws inside Intl; a missing sunrise must not cost the whole source
    return none;
  }
};

const translateSeverity = severity => {
  switch (severity) {
    case 'minor':
      return 'YELLOW';
    case 'moderate':
      return 'ORANGE';
    case 'severe':
      return 'RED';
    case 'extreme':
      return 'RED';
    case 'unknown':
      return 'YELLOW';
    default:
      return 'Unknown';
  }
};

const weatherApiDto = {
  // `forecast` is the raw forecast.json payload for the same location, if one was fetched —
  // it is the only place WeatherAPI reports sunrise/sunset
  currentWeather: (data, metric = true, forecast = null) => {
    if (!data) return null;
    return {
      weather: data?.current?.condition.text,
      description: null,
      condition: conditionFromWeatherApiCode(data?.current?.condition?.code),
      icon: data?.current?.condition.icon,
      dt: data?.current?.last_updated_epoch,
      location: {
        country_code: null,
        coords: {
          lat: data?.location?.lat,
          lon: data?.location?.lon,
        },
        name: data?.location?.name,
        timezone: data?.location?.tz_id,
      },
      temperature: {
        temp: metric ? data?.current?.temp_c : data?.current?.temp_f,
        min: null,
        max: null,
        feels_like: metric ? data?.current?.feels_like_c : data?.current?.feels_like_f,
      },
      pressure: data?.current?.pressure_mb,
      humidity: data?.current?.humidity,
      visibility: metric
        ? data?.current?.vis_km != null
          ? data.current.vis_km * 1000
          : null // km → m
        : data?.current?.vis_miles != null
          ? data.current.vis_miles * 1609.34
          : null, // miles → m
      clouds: {
        all: data?.current?.cloud,
      },
      elevation: {
        sea_level: null,
        ground_level: null,
      },
      wind: {
        speed: metric ? kphToMs(data?.current?.wind_kph) : data?.current?.wind_mph,
        deg: data?.current?.wind_degree,
        dir: data?.current?.wind_dir,
        gust: metric ? kphToMs(data?.current?.gust_kph) : data?.current?.gust_mph,
      },
      precipitation: {
        amount: data?.current?.precip_mm,
        hours_measured: 1,
        type: getPrecipitationType(data?.current),
      },
      ...sunTimesFor(data, forecast),
      uv: data?.current?.uv,
      provider: 'weatherapi.com',
    };
  },
  forecastWeather: (data, metric = true) => {
    if (!data) return null;
    const formatted = {};
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const timezone = data.location?.tz_id;

    // Iterate through each forecast day
    if (data.forecast?.forecastday) {
      for (const day of data.forecast.forecastday) {
        // Iterate through each hour in the day
        if (day.hour) {
          for (const hour of day.hour) {
            // Skip past timestamps
            if (hour.time_epoch <= now) {
              continue;
            }

            const dayName = translateEpochDate(hour.time_epoch, timezone);

            if (!formatted[dayName]) {
              formatted[dayName] = [];
            }

            // Determine precipitation type
            const precipitationType = getPrecipitationType(hour);

            const timeObj = {
              dt: hour.time_epoch,
              weather: hour.condition?.text,
              description: hour.condition?.text,
              condition: conditionFromWeatherApiCode(hour.condition?.code),
              icon: hour.condition?.icon,
              temperature: {
                temp: metric ? hour.temp_c : hour.temp_f,
                feels_like: metric ? hour.feelslike_c : hour.feelslike_f,
                max: null,
                min: null,
              },
              pressure: hour.pressure_mb,
              humidity: hour.humidity,
              elevation: {
                sea_level: null,
                ground_level: null,
              },
              wind: {
                speed: metric ? kphToMs(hour.wind_kph) : hour.wind_mph,
                deg: hour.wind_degree,
                dir: hour.wind_dir,
                gust: metric ? kphToMs(hour.gust_kph) : hour.gust_mph,
              },
              clouds: {
                all: hour.cloud,
              },
              visibility: metric
                ? hour.vis_km != null
                  ? hour.vis_km * 1000
                  : null
                : hour.vis_miles != null
                  ? hour.vis_miles * 1609.34
                  : null,
              precipitation: {
                amount: metric ? hour.precip_mm : hour.precip_in,
                hours_measured: 1,
                type: precipitationType,
              },
            };

            formatted[dayName].push(timeObj);
          }
        }
      }
    }

    return { list: formatted, provider: 'weatherapi.com' };
  },
  weatherWarnings: data => {
    if (!data?.alerts?.alert?.[0]) return null;
    const alertData = data.alerts.alert;
    const alert = alertData[0];

    return {
      severity: translateSeverity(alert.severity.toLowerCase()) || null,
      severityDescription: alert.instruction || null,
      title: alert.headline || null,
      description: alert.desc || null,
      type: alert.event || null,
      warningsCount: alertData.length || 0,
      raw: alertData,
      provider: 'weatherapi.com',
    };
  },
};

export default weatherApiDto;
