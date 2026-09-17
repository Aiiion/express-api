import openWeatherMapsDto from '../dtos/openWeatherMaps.dto.mjs';
import smhiDto from '../dtos/smhi.dto.mjs';

// OWM and SMHI stamp precipitation at the *end* of the period it fell in,
// WeatherAPI and MET at the start. The aggregator reads every entry as
// "the period starting at dt", so these two DTOs must hand each entry the
// precipitation of the interval that begins at its timestamp.
describe('forecast precipitation is stamped at the start of its period', () => {
  describe('openWeatherMaps', () => {
    // Three consecutive 3 h slots, far enough out never to be filtered as past
    const base = Math.floor(Date.UTC(2099, 5, 10, 12) / 1000);
    const item = (offsetHours, extra = {}) => ({
      dt: base + offsetHours * 3600,
      main: { temp: 10 },
      weather: [{ id: 500, main: 'Rain', description: 'light rain', icon: '10d' }],
      wind: { speed: 1, deg: 0 },
      clouds: { all: 50 },
      ...extra,
    });
    const raw = {
      city: { timezone: 0 },
      list: [
        item(0), // 09–12 accumulation: not ours
        item(3, { rain: { '3h': 0.6 } }), // fell during 12–15
        item(6, { snow: { '3h': 1.2 } }), // fell during 15–18
      ],
    };

    it("takes each entry's amount and type from the entry that follows it", () => {
      const hours = Object.values(openWeatherMapsDto.forecastWeather(raw).list).flat();

      expect(hours.map(h => h.dt)).toEqual([base, base + 3 * 3600]);
      expect(hours[0].precipitation).toEqual({ amount: 0.6, hours_measured: 3, type: 'rain' });
      expect(hours[1].precipitation).toEqual({ amount: 1.2, hours_measured: 3, type: 'snow' });
    });

    it('drops the final entry, whose period has no successor to describe it', () => {
      const hours = Object.values(openWeatherMapsDto.forecastWeather(raw).list).flat();

      expect(hours.some(h => h.dt === base + 6 * 3600)).toBe(false);
    });

    it("keeps the entry's own instantaneous fields", () => {
      const [first] = Object.values(openWeatherMapsDto.forecastWeather(raw).list).flat();

      expect(first.temperature.temp).toBe(10);
      expect(first.condition).toBe('light_rain');
    });
  });

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
