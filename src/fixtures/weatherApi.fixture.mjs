import { exampleIp } from "../utils/constants.mjs";

// Helper to generate timestamps relative to now
const now = () => Math.floor(Date.now() / 1000);
const hoursFromNow = (hours) => now() + (hours * 3600);
const formatLocaltime = (epochSeconds) => {
  const date = new Date(epochSeconds * 1000);
  return date.toISOString().replace('T', ' ').substring(0, 16);
};
const formatDate = (epochSeconds) => {
  const date = new Date(epochSeconds * 1000);
  return date.toISOString().substring(0, 10);
};
const formatTime = (epochSeconds) => {
  const date = new Date(epochSeconds * 1000);
  return `${formatDate(epochSeconds)} ${date.toISOString().substring(11, 16)}`;
};

// Get start of tomorrow (midnight)
const getTomorrowStart = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return Math.floor(tomorrow.getTime() / 1000);
};

export const getIpLocation = {
    fixture: true,
    get data() {
      return {
        "ip": exampleIp,
        "type": "ipv4",
        "continent_code": "EU",
        "continent_name": "Europe",
        "country_code": "SE",
        "country_name": "Sweden",
        "is_eu": "true",
        "geoname_id": 2726756,
        "city": "Alingsås",
        "region": "Vastra Gotaland",
        "lat": 57.9303,
        "lon": 12.5335,
        "tz_id": "Europe/Stockholm",
        "localtime_epoch": now(),
        "localtime": formatLocaltime(now())
      };
    }
};

export const weather = {
    fixture: true,
    get data() {
      return {
        "location": {
            "name": "Stockholm",
            "region": "Stockholms Lan",
            "country": "Sweden",
            "lat": 59.333,
            "lon": 18.05,
            "tz_id": "Europe/Stockholm",
            "localtime_epoch": now(),
            "localtime": formatLocaltime(now())
        },
        "current": {
            "last_updated_epoch": now(),
            "last_updated": formatLocaltime(now()),
            "temp_c": -6.7,
            "temp_f": 19.9,
            "is_day": 0,
            "condition": {
                "text": "Clear",
                "icon": "//cdn.weatherapi.com/weather/64x64/night/113.png",
                "code": 1000
            },
            "wind_mph": 4.9,
            "wind_kph": 7.9,
            "wind_degree": 46,
            "wind_dir": "NE",
            "pressure_mb": 1029.0,
            "pressure_in": 30.39,
            "precip_mm": 0.0,
            "precip_in": 0.0,
            "humidity": 79,
            "cloud": 0,
            "feelslike_c": -10.6,
            "feelslike_f": 13.0,
            "windchill_c": -14.1,
            "windchill_f": 6.6,
            "heatindex_c": -9.7,
            "heatindex_f": 14.6,
            "dewpoint_c": -11.1,
            "dewpoint_f": 12.0,
            "vis_km": 10.0,
            "vis_miles": 6.0,
            "uv": 0.0,
            "gust_mph": 10.3,
            "gust_kph": 16.6
        }
      };
    },
};

export const weatherForecast = {
    fixture: true,
    get data() {
      const tomorrowStart = getTomorrowStart();
      
      // Generate hourly forecasts for the next 24 hours
      const generateHours = (dayStartEpoch) => {
        const hours = [];
        for (let h = 0; h < 24; h++) {
          const hourEpoch = dayStartEpoch + (h * 3600);
          hours.push({
            "time_epoch": hourEpoch,
            "time": formatTime(hourEpoch),
            "temp_c": 2.8 + (h * 0.3),
            "temp_f": 37.0 + (h * 0.5),
            "is_day": h >= 6 && h < 20 ? 1 : 0,
            "condition": {
              "text": h >= 6 && h < 20 ? "Sunny" : "Clear",
              "icon": h >= 6 && h < 20 
                ? "//cdn.weatherapi.com/weather/64x64/day/113.png"
                : "//cdn.weatherapi.com/weather/64x64/night/113.png",
              "code": 1000
            },
            "wind_mph": 4.0 + (h % 5),
            "wind_kph": 6.4 + (h % 5) * 1.6,
            "wind_degree": 220 + (h % 40),
            "wind_dir": "SW",
            "pressure_mb": 1022.0,
            "pressure_in": 30.17,
            "precip_mm": 0.0,
            "precip_in": 0.0,
            "snow_cm": 0.0,
            "humidity": 80 + (h % 10),
            "cloud": h % 15,
            "feelslike_c": 1.5 + (h * 0.25),
            "feelslike_f": 34.7 + (h * 0.45),
            "windchill_c": 1.5 + (h * 0.25),
            "windchill_f": 34.7 + (h * 0.45),
            "heatindex_c": 2.8 + (h * 0.3),
            "heatindex_f": 37.0 + (h * 0.5),
            "dewpoint_c": 0.3,
            "dewpoint_f": 32.5,
            "will_it_rain": 0,
            "chance_of_rain": 0,
            "will_it_snow": 0,
            "chance_of_snow": 0,
            "vis_km": 10.0,
            "vis_miles": 6.0,
            "gust_mph": 8.0 + (h % 6),
            "gust_kph": 12.9 + (h % 6) * 1.6,
            "uv": h >= 10 && h <= 14 ? 2.0 : 0
          });
        }
        return hours;
      };

      return {
        "location": {
            "name": "Stockholm",
            "region": "Stockholms Lan",
            "country": "Sweden",
            "lat": 59.333,
            "lon": 18.05,
            "tz_id": "Europe/Stockholm",
            "localtime_epoch": now(),
            "localtime": formatLocaltime(now())
        },
        "current": {
            "last_updated_epoch": now(),
            "last_updated": formatLocaltime(now()),
            "temp_c": -7.9,
            "temp_f": 17.8,
            "is_day": 0,
            "condition": {
                "text": "Clear",
                "icon": "//cdn.weatherapi.com/weather/64x64/night/113.png",
                "code": 1000
            },
            "wind_mph": 4.9,
            "wind_kph": 7.9,
            "wind_degree": 46,
            "wind_dir": "NE",
            "pressure_mb": 1029.0,
            "pressure_in": 30.39,
            "precip_mm": 0.0,
            "precip_in": 0.0,
            "humidity": 85,
            "cloud": 0,
            "feelslike_c": -12.0,
            "feelslike_f": 10.4,
            "windchill_c": -14.1,
            "windchill_f": 6.6,
            "heatindex_c": -9.7,
            "heatindex_f": 14.6,
            "dewpoint_c": -11.1,
            "dewpoint_f": 12.0,
            "vis_km": 10.0,
            "vis_miles": 6.0,
            "uv": 0.0,
            "gust_mph": 10.3,
            "gust_kph": 16.6
        },
        "forecast": {
            "forecastday": [
                {
                    "date": formatDate(tomorrowStart),
                    "date_epoch": tomorrowStart,
                    "day": {
                        "maxtemp_c": 11.3,
                        "maxtemp_f": 52.3,
                        "mintemp_c": 1.8,
                        "mintemp_f": 35.3,
                        "avgtemp_c": 6.1,
                        "avgtemp_f": 43.0,
                        "maxwind_mph": 11.2,
                        "maxwind_kph": 18.0,
                        "totalprecip_mm": 0.0,
                        "totalprecip_in": 0.0,
                        "totalsnow_cm": 0.0,
                        "avgvis_km": 10.0,
                        "avgvis_miles": 6.0,
                        "avghumidity": 69,
                        "daily_will_it_rain": 0,
                        "daily_chance_of_rain": 0,
                        "daily_will_it_snow": 0,
                        "daily_chance_of_snow": 0,
                        "condition": {
                            "text": "Sunny",
                            "icon": "//cdn.weatherapi.com/weather/64x64/day/113.png",
                            "code": 1000
                        },
                        "uv": 0.7
                    },
                    "astro": {
                        "sunrise": "06:14 AM",
                        "sunset": "07:31 PM",
                        "moonrise": "07:09 PM",
                        "moonset": "05:54 AM",
                        "moon_phase": "Waxing Gibbous",
                        "moon_illumination": 99,
                        "is_moon_up": 1,
                        "is_sun_up": 0
                    },
                    "hour": generateHours(tomorrowStart)
                }
            ]
        }
      };
    }
};
