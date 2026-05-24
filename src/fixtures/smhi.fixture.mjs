/**
 * Sample raw response from the SMHI open-data meteorological forecast API.
 * Timestamps are set in the far future so DTO filters (dt > now) never skip them.
 */
export const smhiForecast = {
  fixture: true,
  data: {
    geometry: {
      type: "Point",
      coordinates: [16.158549, 58.577821],
    },
    timeSeries: [
      {
        time: "2099-06-01T12:00:00Z",
        intervalParametersStartTime: "2099-06-01T11:00:00Z",
        data: {
          air_temperature: 10.5,
          wind_from_direction: 180,
          wind_speed: 3.5,
          wind_speed_of_gust: 6.0,
          relative_humidity: 75,
          air_pressure_at_mean_sea_level: 1013.0,
          visibility_in_air: 10.0,
          cloud_area_fraction: 6,
          precipitation_amount_mean: 0.5,
          precipitation_frozen_part: 0,
          predominant_precipitation_type_at_surface: 1,
          symbol_code: 18,
        },
      },
      {
        time: "2099-06-01T13:00:00Z",
        intervalParametersStartTime: "2099-06-01T12:00:00Z",
        data: {
          air_temperature: 11.2,
          wind_from_direction: 190,
          wind_speed: 4.0,
          wind_speed_of_gust: 7.0,
          relative_humidity: 70,
          air_pressure_at_mean_sea_level: 1012.5,
          visibility_in_air: 9.5,
          cloud_area_fraction: 7,
          precipitation_amount_mean: 0.2,
          precipitation_frozen_part: 0,
          predominant_precipitation_type_at_surface: 1,
          symbol_code: 18,
        },
      },
    ],
  },
};
