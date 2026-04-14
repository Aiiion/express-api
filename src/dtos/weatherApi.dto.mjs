import { translateEpochDay } from "../utils/dateTimeHelpers.mjs";
import { kphToMs } from "../utils/mathHelpers.mjs";

const getPrecipitationType = (hour) => {
  // Check for snow
  if (hour.snow_cm && hour.snow_cm > 0) {
    return "snow";
  }
  // Check for rain (or any precipitation)
  if ((hour.precip_mm && hour.precip_mm > 0) || (hour.precip_in && hour.precip_in > 0)) {
    // Check condition text for specific types
    const conditionText = hour.condition?.text?.toLowerCase() || '';
    if (conditionText.includes('snow')) {
      return "snow";
    }
    return "rain";
  }
  return "none";
};

const translateSeverity = (severity) => {
  switch (severity) {
    case "minor":
      return "YELLOW";
    case "moderate":
      return "ORANGE";
    case "severe":
      return "RED";
    case "extreme":
      return "RED";
    case "unknown":
      return "YELLOW";
    default:
      return "Unknown";
  }
};

const weatherApiDto = {
  currentWeather: (data, metric = true) => {
    if (!data) return null;
    return {
      weather: data?.current?.condition.text,
      description: null,
      icon: data?.current?.condition.icon,
      dt: data?.current?.last_updated_epoch,
      location: {
        country_code: null,
        coords: {
          lat: data?.location?.lat,
          lon: data?.location?.lon,
        },
        name: data?.location?.name,
        timezone: data?.location?.tz_id
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
        ? (data?.current?.vis_km != null ? data.current.vis_km * 1000 : null)      // km → m
        : (data?.current?.vis_miles != null ? data.current.vis_miles * 1609.34 : null), // miles → m
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
      sunrise: null,
      sunset: null,
      uv: data?.current?.uv,
      provider: "weatherapi.com"
    }
  },
  forecastWeather: (data, metric = true) => {
    if (!data) return null;
    const formatted = {};
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const timezone = data.location?.tz_id;

    // Iterate through each forecast day
    if (data.forecast?.forecastday) {
      for (let day of data.forecast.forecastday) {
        // Iterate through each hour in the day
        if (day.hour) {
          for (let hour of day.hour) {
            // Skip past timestamps
            if (hour.time_epoch <= now) {
              continue;
            }

            const dayName = translateEpochDay(hour.time_epoch, timezone);
            
            if (!formatted[dayName]) {
              formatted[dayName] = [];
            }

            // Determine precipitation type
            const precipitationType = getPrecipitationType(hour);

            const timeObj = {
              dt: hour.time_epoch,
              weather: hour.condition?.text,
              description: hour.condition?.text,
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
                ? (hour.vis_km != null ? hour.vis_km * 1000 : null)
                : (hour.vis_miles != null ? hour.vis_miles * 1609.34 : null),
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

    return { list: formatted, provider: "weatherapi.com" };
  },
  weatherWarnings: (data) => {
    if (!data || !data.alerts?.alert?.[0]) return null;
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
    };
  },
};

export default weatherApiDto;