import { translateEpochDay } from "../utils/dateTimeHelpers.mjs";

const getHoursMeasured = (time, intervalStart) => {
  const endMs = new Date(time).getTime();
  const startMs = new Date(intervalStart).getTime();
  return Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60)));
};

const mapPrecipitationType = (typeCode) => {
  if (typeCode === 0) return "none";
  if (typeCode === 5 || typeCode === 6 || typeCode === 9) return "snow";
  if (typeCode === 10) return "hail";
  return "rain";
};

const mapSymbolToWeather = (symbolCode) => {
  const symbols = {
    1: "Clear sky", 2: "Nearly clear sky", 3: "Variable cloudiness",
    4: "Halfclear sky", 5: "Cloudy sky", 6: "Overcast", 7: "Fog",
    8: "Light rain showers", 9: "Moderate rain showers", 10: "Heavy rain showers",
    11: "Thunderstorm", 12: "Light sleet showers", 13: "Moderate sleet showers",
    14: "Heavy sleet showers", 15: "Light snow showers", 16: "Moderate snow showers",
    17: "Heavy snow showers", 18: "Light rain", 19: "Moderate rain", 20: "Heavy rain",
    21: "Thunder", 22: "Light sleet", 23: "Moderate sleet", 24: "Heavy sleet",
    25: "Light snowfall", 26: "Moderate snowfall", 27: "Heavy snowfall",
  };
  return symbols[symbolCode] || null;
};

const mapTimeSeriesEntry = (entry) => {
  const { time, intervalParametersStartTime, data } = entry;
  const dt = Math.floor(new Date(time).getTime() / 1000);
  const hoursMeasured = getHoursMeasured(time, intervalParametersStartTime);
  const precipType = mapPrecipitationType(data.predominant_precipitation_type_at_surface);
  return {
    dt,
    weather: mapSymbolToWeather(data.symbol_code),
    description: mapSymbolToWeather(data.symbol_code),
    icon: null,
    temperature: {
      temp: data.air_temperature ?? null,
      feels_like: null,
      max: null,
      min: null,
    },
    pressure: data.air_pressure_at_mean_sea_level ?? null,
    humidity: data.relative_humidity ?? null,
    visibility: data.visibility_in_air != null ? data.visibility_in_air * 1000 : null,
    clouds: {
      all: data.cloud_area_fraction != null ? Math.round((data.cloud_area_fraction / 8) * 100) : null,
    },
    elevation: {
      sea_level: null,
      ground_level: null,
    },
    wind: {
      speed: data.wind_speed ?? null,
      deg: data.wind_from_direction ?? null,
      dir: null,
      gust: data.wind_speed_of_gust ?? null,
    },
    precipitation: {
      amount: data.precipitation_amount_mean ?? 0,
      hours_measured: hoursMeasured,
      type: precipType,
    },
  };
};

const smhiDto = {
  currentWeather: (data) => {
    if (!data?.timeSeries?.length) return null;
    const coords = data.geometry?.coordinates
      ? { lat: data.geometry.coordinates[1], lon: data.geometry.coordinates[0] }
      : null;
    const entry = data.timeSeries[0];
    return {
      ...mapTimeSeriesEntry(entry),
      location: {
        country_code: "SE",
        coords,
        name: null,
        timezone: "UTC",
      },
      sunrise: null,
      sunset: null,
      uv: null,
      provider: "smhi.se",
    };
  },
  forecastWeather: (data) => {
    if (!data?.timeSeries) return null;
    const now = Math.floor(Date.now() / 1000);
    const formatted = {};

    for (const entry of data.timeSeries) {
      const dt = Math.floor(new Date(entry.time).getTime() / 1000);
      if (dt <= now) continue;

      const day = translateEpochDay(dt);
      if (!formatted[day]) formatted[day] = [];
      formatted[day].push(mapTimeSeriesEntry(entry));
    }

    return { list: formatted, provider: "smhi.se" };
  },
  weatherWarnings: (data) => {
    if (!data) return null;

    return {
      severity: data.inner?.level || null,
      severityDescription: describeSeverity(data.inner?.level) || null,
      title: data.inner?.en || null,
      description: data.inner?.en || null,
      type: data.inner?.type || null,
      warningsCount: data.inner?.warningsCount || 0,
      raw: data,
    };
  },
};

//todo: crate severity enum and add translate layer for enum here
const describeSeverity = (severity) => {
  switch (severity) {
    case 'YELLOW':
      return "Certain risks to the public. Disruptions to some societal functions. Take extra care - especially at places more susceptible to changing weather conditions";
    case 'ORANGE':
      return "Danger to the public. Disruptions to societal functions.Avoid exposure to the weather conditions.";
    case 'RED':
      return "Great danger to the public. Extensive disruptions to societal functions. Avoid all exposure to the weather conditions!";
    case 'NONE':
      return "No warnings in effect.";
    default:
      return "Unknown";
  }
}

export default smhiDto;