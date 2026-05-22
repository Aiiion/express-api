/**
 * Sample raw response from the met.no Locationforecast 2.0 compact endpoint.
 * Timestamps are set in the far future so DTO filters (dt > now) never skip them.
 */
export const metForecast = {
  fixture: true,
  data: {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [18.0, 59.4, 10],
    },
    properties: {
      timeseries: [
        {
          time: "2099-06-01T12:00:00Z",
          data: {
            instant: {
              details: {
                air_temperature: 10.5,
                wind_from_direction: 180,
                wind_speed: 3.5,
                relative_humidity: 75,
                air_pressure_at_sea_level: 1013.0,
                cloud_area_fraction: 50,
              },
            },
            next_1_hours: {
              summary: {
                symbol_code: "partlycloudy_day",
              },
              details: {
                precipitation_amount: 0.5,
              },
            },
          },
        },
        {
          time: "2099-06-01T13:00:00Z",
          data: {
            instant: {
              details: {
                air_temperature: 11.2,
                wind_from_direction: 190,
                wind_speed: 4.0,
                relative_humidity: 70,
                air_pressure_at_sea_level: 1012.5,
                cloud_area_fraction: 60,
              },
            },
            next_1_hours: {
              summary: {
                symbol_code: "rain",
              },
              details: {
                precipitation_amount: 1.2,
              },
            },
          },
        },
      ],
    },
  },
};
