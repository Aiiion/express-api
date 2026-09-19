// Helper to generate timestamps relative to now
const now = () => Math.floor(Date.now() / 1000);
const hoursFromNow = hours => now() + hours * 3600;

export const airPollution = {
  get data() {
    return {
      coord: {
        lon: 17.891,
        lat: 59.496,
      },
      list: [
        {
          main: {
            aqi: 1,
          },
          components: {
            co: 143.69,
            no: 0,
            no2: 4.22,
            o3: 49.89,
            so2: 0.45,
            pm2_5: 3.82,
            pm10: 4.56,
            nh3: 0.31,
          },
          dt: now(),
        },
      ],
    };
  },
};

export const airPollutionForecast = {
  get data() {
    return {
      coord: {
        lon: 17.891,
        lat: 59.496,
      },
      list: [
        {
          main: { aqi: 1 },
          components: { co: 143.69, no: 0, no2: 4.22, o3: 49.89, so2: 0.45, pm2_5: 3.82, pm10: 4.56, nh3: 0.31 },
          dt: hoursFromNow(1),
        },
        {
          main: { aqi: 1 },
          components: { co: 144.95, no: 0, no2: 4.09, o3: 49.3, so2: 0.45, pm2_5: 4.07, pm10: 4.92, nh3: 0.36 },
          dt: hoursFromNow(2),
        },
        {
          main: { aqi: 1 },
          components: { co: 146.39, no: 0, no2: 3.94, o3: 48.97, so2: 0.44, pm2_5: 4.31, pm10: 5.25, nh3: 0.42 },
          dt: hoursFromNow(3),
        },
        {
          main: { aqi: 1 },
          components: { co: 148.09, no: 0, no2: 3.82, o3: 48.44, so2: 0.41, pm2_5: 4.55, pm10: 5.54, nh3: 0.48 },
          dt: hoursFromNow(4),
        },
        {
          main: { aqi: 1 },
          components: { co: 149.66, no: 0, no2: 3.73, o3: 47.2, so2: 0.38, pm2_5: 4.82, pm10: 5.83, nh3: 0.5 },
          dt: hoursFromNow(5),
        },
      ],
    };
  },
};
