import smhiDto from '../dtos/smhi.dto.mjs';

// SMHI stamps precipitation at the *end* of the period it fell in, WeatherAPI
// and MET at the start. The aggregator reads every entry as "the period
// starting at dt", so the SMHI DTO must hand each entry the precipitation of
// the interval that begins at its timestamp.
describe('forecast precipitation is stamped at the start of its period', () => {
  describe('smhi', () => {
    const entry = (time, intervalStart, precip, typeCode = 1) => ({
      time,
      intervalParametersStartTime: intervalStart,
      data: {
        air_temperature: 5,
        precipitation_amount_mean: precip,
        predominant_precipitation_type_at_surface: typeCode,
        symbol_code: 19,
      },
    });
    // Hourly, then the series coarsens to a 6 h interval — as the live API does
    const raw = {
      timeSeries: [
        entry('2099-06-10T12:00:00Z', '2099-06-10T11:00:00Z', 0.1),
        entry('2099-06-10T13:00:00Z', '2099-06-10T12:00:00Z', 0.5),
        entry('2099-06-10T18:00:00Z', '2099-06-10T13:00:00Z', 3.0, 5), // snow
      ],
    };

    it('hands each entry the interval that starts at its own time', () => {
      const hours = Object.values(smhiDto.forecastWeather(raw).list).flat();

      expect(hours).toHaveLength(2);
      // 12:00 gets the 12–13 interval; 13:00 gets the 13–18 one
      expect(hours[0].precipitation).toEqual({ amount: 0.5, hours_measured: 1, type: 'rain' });
      expect(hours[1].precipitation).toEqual({ amount: 3.0, hours_measured: 5, type: 'snow' });
    });

    it('keeps the current-weather entry on its own interval, the hour we are in', () => {
      const current = smhiDto.currentWeather(raw);

      expect(current.precipitation).toEqual({ amount: 0.1, hours_measured: 1, type: 'rain' });
    });
  });
});
