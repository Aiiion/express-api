const weatherApiMap = {
  weather: "data.current.condition.text",
  description: null,
  icon: "data.current.condition.icon",
  dt: "data.current.last_updated_epoch",
  "location.country_code": null,
  "location.coords.lat": "data.location.lat",
  "location.coords.lon": "data.location.lon",
  "location.name": "data.location.name",
  "location.timezone": "data.location.tz_id",
  "temperature.temp_c": "data.current.temp_c",
  "temperature.temp_f": "data.current.temp_f",
  "temperature.min": null,
  "temperature.max": null,
  "temperature.feels_like_c": "data.current.feels_like_c",
  "temperature.feels_like_f": "data.current.feels_like_f",
  pressure: "data.current.pressure_mb",
  humidity: "data.current.humidity",
  visibility: "data.current.visibility_km",
  "clouds.all": "data.current.cloud",
  "elevation.sea_level": null,
  "elevation.ground_level": null,
  "wind.speed_kph": "data.current.wind_kph",
  "wind.speed_mph": "data.current.wind_mph",
  "wind.dir": "data.current.wind_dir",
  "wind.gust_kph": "data.current.gust_kph",
  "wind.gust_mph": "data.current.gust_mph",
  "precipitation.amount_mm": "data.current.precip_mm",
  "precipitation.amount_in": "data.current.precip_in",
  "precipitation.condition_text": "data.current.condition.text",
  sunrise: null,
  sunset: null,
  uv: "data.current.uv",
  provider: "weatherapi.com"
}

//ramda path

const weatherApiDto = {
  currentWeather: (data, metric = true) => {
    if (!data) return null;
    return {
      weather: data?.current?.condition.text,
      description: null,
      icon: data?.current?.condition.icon,
      dt: data.current.last_updated_epoch,
      location: {
        country_code: null,
        coords: {
          lat: data.location.lat,
          lon: data.location.lon,
        },
        name: data?.location.name,
        timezone: data?.location.tz_id
      },
      temprature: {
        temp: metric ? data?.current?.temp_c : data?.current?.temp_f,
        min: null,
        max: null,
        feels_like: metric ? data?.current?.feels_like_c : data?.current?.feels_like_c,
      },
      pressure: data?.current?.pressure_mb,
      humidity: data?.current?.humidity,
      visibility: data?.current.visibility_km * 1000,
      clouds: {
        all: data?.current.cloud,
      },
      elevation: {
        sea_level: null,
        ground_level: null,
      },
      wind: {
        speed: metric ? data.current.wind_kph : data.current.wind_mph,
        dir: data.current.wind_dir,
        gust: metric ? data.current.gust_kph : data.current.gust_mph,
      },
      precipitation: {
        amount: metric ? data.current.precip_mm : data.current.precip_in,
        hours_measured: 1,
        type: data.current.condition.text.contains('snow')
          ? 'snow'
          : (
            data.current.precip_mm == 0.0
              ? 'none'
              : 'rain'
          ),
      },
      sunrise: null,
      sunset: null,
      uv: data.current.uv,
      provider: "weatherapi.com"
    }
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
export default weatherApiDto;