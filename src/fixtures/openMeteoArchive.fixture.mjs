// Trimmed snapshot of https://archive-api.open-meteo.com/v1/archive
// Two hourly entries; one null value to verify null filtering
export const openMeteoArchiveFixture = {
  latitude: 59.33,
  longitude: 18.06,
  timezone: 'UTC',
  hourly: {
    time:                  ['2026-06-23T00:00', '2026-06-23T01:00'],
    temperature_2m:        [14.2, 13.8],
    precipitation:         [0.0,  0.5],
    wind_speed_10m:        [4.5,  null],  // null — must be excluded from avg
    relative_humidity_2m:  [75,   78],
    surface_pressure:      [1013.0, 1012.5],
  },
};
