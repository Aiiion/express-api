export const weather = {
  fixture: true,
  data: {
    coord: {
      lon: 17.891,
      lat: 59.496,
    },
    weather: [
      {
        id: 804,
        main: "Clouds",
        description: "overcast clouds",
        icon: "04n",
      },
    ],
    base: "stations",
    main: {
      temp: 283.62,
      feels_like: 283.1,
      temp_min: 283.18,
      temp_max: 284.05,
      pressure: 1011,
      humidity: 91,
      sea_level: 1011,
      grnd_level: 1009,
    },
    visibility: 10000,
    wind: {
      speed: 3.6,
      deg: 230,
    },
    clouds: {
      all: 100,
    },
    dt: 1762381220,
    sys: {
      type: 2,
      id: 2005235,
      country: "SE",
      sunrise: 1762323507,
      sunset: 1762353935,
    },
    timezone: 3600,
    id: 2666237,
    name: "Upplands Väsby Municipality",
    cod: 200,
  },
};

export const weatherForecast = {
  data: {
    cod: "200",
    message: 0,
    cnt: 40,
    list: [
      {
        dt: 1762387200,
        main: {
          temp: 283.62,
          feels_like: 283.1,
          temp_min: 283.62,
          temp_max: 284.68,
          pressure: 1012,
          sea_level: 1012,
          grnd_level: 1009,
          humidity: 91,
          temp_kf: -1.06,
        },
        weather: [
          {
            id: 804,
            main: "Clouds",
            description: "overcast clouds",
            icon: "04n",
          },
        ],
        clouds: {
          all: 100,
        },
        wind: {
          speed: 3.19,
          deg: 230,
          gust: 8.01,
        },
        visibility: 10000,
        pop: 0,
        sys: {
          pod: "n",
        },
        dt_txt: "2025-11-06 00:00:00",
      },
      {
        dt: 1762398000,
        main: {
          temp: 283.99,
          feels_like: 283.56,
          temp_min: 283.99,
          temp_max: 284.72,
          pressure: 1012,
          sea_level: 1012,
          grnd_level: 1008,
          humidity: 93,
          temp_kf: -0.73,
        },
        weather: [
          {
            id: 804,
            main: "Clouds",
            description: "overcast clouds",
            icon: "04n",
          },
        ],
        clouds: {
          all: 100,
        },
        wind: {
          speed: 2.51,
          deg: 222,
          gust: 6.28,
        },
        visibility: 10000,
        pop: 0,
        sys: {
          pod: "n",
        },
        dt_txt: "2025-11-06 03:00:00",
      },
      {
        dt: 1762408800,
        main: {
          temp: 283.53,
          feels_like: 283.1,
          temp_min: 283.48,
          temp_max: 283.53,
          pressure: 1012,
          sea_level: 1012,
          grnd_level: 1009,
          humidity: 95,
          temp_kf: 0.05,
        },
        weather: [
          {
            id: 500,
            main: "Rain",
            description: "light rain",
            icon: "10n",
          },
        ],
        clouds: {
          all: 100,
        },
        wind: {
          speed: 2.63,
          deg: 219,
          gust: 6.62,
        },
        visibility: 10000,
        pop: 0.2,
        rain: {
          "3h": 0.1,
        },
        sys: {
          pod: "n",
        },
        dt_txt: "2025-11-06 06:00:00",
      },
    ],
  },
};

export const airPollution = {
  data: {
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
        dt: 1762381461,
      },
    ],
  },
};

export const airPollutionForecast = {
  data: {
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
        dt: 1762380000,
      },
      {
        main: {
          aqi: 1,
        },
        components: {
          co: 144.95,
          no: 0,
          no2: 4.09,
          o3: 49.3,
          so2: 0.45,
          pm2_5: 4.07,
          pm10: 4.92,
          nh3: 0.36,
        },
        dt: 1762383600,
      },
      {
        main: {
          aqi: 1,
        },
        components: {
          co: 146.39,
          no: 0,
          no2: 3.94,
          o3: 48.97,
          so2: 0.44,
          pm2_5: 4.31,
          pm10: 5.25,
          nh3: 0.42,
        },
        dt: 1762387200,
      },
      {
        main: {
          aqi: 1,
        },
        components: {
          co: 148.09,
          no: 0,
          no2: 3.82,
          o3: 48.44,
          so2: 0.41,
          pm2_5: 4.55,
          pm10: 5.54,
          nh3: 0.48,
        },
        dt: 1762390800,
      },
      {
        main: {
          aqi: 1,
        },
        components: {
          co: 149.66,
          no: 0,
          no2: 3.73,
          o3: 47.2,
          so2: 0.38,
          pm2_5: 4.82,
          pm10: 5.83,
          nh3: 0.5,
        },
        dt: 1762394400,
      },
    ],
  },
};
