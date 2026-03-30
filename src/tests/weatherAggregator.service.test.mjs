import { jest } from "@jest/globals";

// Stable mock references created before module mocking so all tests share them
const owmServiceMocks = {
  currentWeather: jest.fn(),
  forecastWeather: jest.fn(),
};

const weatherApiServiceMocks = {
  currentWeather: jest.fn(),
  forecastWeather: jest.fn(),
};

const owmDtoMocks = {
  currentWeather: jest.fn(),
  forecastWeather: jest.fn(),
};

const weatherApiDtoMocks = {
  currentWeather: jest.fn(),
  forecastWeather: jest.fn(),
  weatherWarnings: jest.fn(),
};

// Register mocks before any dynamic imports
jest.unstable_mockModule("../services/openWeatherMaps.service.mjs", () => ({
  default: owmServiceMocks,
}));

jest.unstable_mockModule("../services/weatherApi.service.mjs", () => ({
  default: weatherApiServiceMocks,
}));

jest.unstable_mockModule("../dtos/openWeatherMaps.dto.mjs", () => ({
  default: owmDtoMocks,
}));

jest.unstable_mockModule("../dtos/weatherApi.dto.mjs", () => ({
  default: weatherApiDtoMocks,
}));

// ---------------------------------------------------------------------------
// Pre-normalized test data (what the DTOs would return after transforming raw
// API responses). Using controlled values makes expected aggregations precise.
// ---------------------------------------------------------------------------

const owmNormalizedCurrent = {
  weather: "Clouds",
  description: "overcast clouds",
  icon: "04n",
  dt: 1000000,
  location: {
    country_code: "SE",
    coords: { lat: 59.5, lon: 17.9 },
    name: "Test City",
    timezone: 3600,
  },
  temperature: { temp: 10.0, min: 8.0, max: 12.0, feels_like: 9.0 },
  pressure: 1010,
  humidity: 80,
  visibility: 10000,
  clouds: { all: 100 },
  elevation: { sea_level: 1010, ground_level: 1008 },
  wind: { speed: 4.0, deg: 220, dir: null, gust: null },
  precipitation: { amount: 2.0, hours_measured: 1, type: "rain" },
  sunrise: 1000100,
  sunset: 1001000,
  uv: null,
  provider: "openweathermaps.org",
};

const weatherApiNormalizedCurrent = {
  weather: "Clear",
  description: null,
  icon: "//cdn.weatherapi.com/weather/64x64/night/113.png",
  dt: 1000500,
  location: {
    country_code: null,
    coords: { lat: 59.3, lon: 18.0 },
    name: "Stockholm",
    timezone: "Europe/Stockholm",
  },
  temperature: { temp: 6.0, min: null, max: null, feels_like: 4.0 },
  pressure: 1030,
  humidity: 70,
  visibility: 10000,
  clouds: { all: 0 },
  elevation: { sea_level: null, ground_level: null },
  wind: { speed: 8.0, deg: 46, dir: "NE", gust: 16.6 },
  precipitation: { amount: 0.0, hours_measured: 1, type: "none" },
  sunrise: null,
  sunset: null,
  uv: 0.0,
  provider: "weatherapi.com",
};

// Forecast hour shared across both providers at the same timestamp
const owmForecastHour = {
  dt: 1000000,
  weather: "Clouds",
  description: "overcast clouds",
  icon: "04n",
  temperature: { temp: 10.0, feels_like: 9.0, max: 12.0, min: 8.0 },
  pressure: 1010,
  humidity: 80,
  visibility: 10000,
  elevation: { sea_level: 1010, ground_level: 1008 },
  wind: { speed: 4.0, deg: 220, dir: null, gust: null },
  clouds: { all: 100 },
  precipitation: { amount: 0.0, hours_measured: 3, type: "none" },
};

const weatherApiForecastHour = {
  dt: 1000000,
  weather: "Partly Cloudy",
  description: "Partly Cloudy",
  icon: "//cdn.weatherapi.com/weather/64x64/night/116.png",
  temperature: { temp: 6.0, feels_like: 4.0, max: null, min: null },
  pressure: 1030,
  humidity: 70,
  visibility: 10000,
  elevation: { sea_level: null, ground_level: null },
  wind: { speed: 8.0, deg: 46, dir: "NE", gust: 16.6 },
  clouds: { all: 25 },
  precipitation: { amount: 0.0, hours_measured: 1, type: "none" },
};

const owmNormalizedForecast = {
  list: { Monday: [owmForecastHour] },
  provider: "openweathermaps.org",
};

const weatherApiNormalizedForecast = {
  list: { Monday: [weatherApiForecastHour] },
  provider: "weatherapi.com",
};

// ---------------------------------------------------------------------------

let weatherAggregatorService;

describe("weatherAggregatorService", () => {
  beforeAll(async () => {
    const mod = await import("../services/weatherAggregator.service.mjs");
    weatherAggregatorService = mod.default;
  });

  // Reset every mock to a known-good state before each test to prevent
  // one test's overrides from leaking into the next.
  beforeEach(() => {
    owmServiceMocks.currentWeather.mockResolvedValue({});
    owmServiceMocks.forecastWeather.mockResolvedValue({});
    weatherApiServiceMocks.currentWeather.mockResolvedValue({});
    weatherApiServiceMocks.forecastWeather.mockResolvedValue({});
    owmDtoMocks.currentWeather.mockReturnValue(owmNormalizedCurrent);
    owmDtoMocks.forecastWeather.mockReturnValue(null);
    weatherApiDtoMocks.currentWeather.mockReturnValue(weatherApiNormalizedCurrent);
    weatherApiDtoMocks.forecastWeather.mockReturnValue(null);
  });

  // -------------------------------------------------------------------------
  // currentWeather
  // -------------------------------------------------------------------------
  describe("currentWeather", () => {
    it("averages numeric fields (temperature, humidity, pressure) from both providers", async () => {
      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      expect(result.temperature.temp).toBeCloseTo(8.0);  // (10 + 6) / 2
      expect(result.humidity).toBeCloseTo(75);            // (80 + 70) / 2
      expect(result.pressure).toBeCloseTo(1020);          // (1010 + 1030) / 2
    });

    it("prefers the WeatherAPI icon over the OWM icon", async () => {
      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      expect(result.icon).toBe("//cdn.weatherapi.com/weather/64x64/night/113.png");
    });

    it("uses the most recent dt (maximum) from both providers", async () => {
      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      expect(result.dt).toBe(1000500); // max(1000000, 1000500)
    });

    it("includes both provider names in the providers array", async () => {
      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      expect(result.providers).toContain("openweathermaps.org");
      expect(result.providers).toContain("weatherapi.com");
    });

    it("omits the errors property when all providers succeed", async () => {
      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      expect(result.errors).toBeUndefined();
    });

    it("normalizes precipitation amounts when both providers report 1-hour periods", async () => {
      owmDtoMocks.currentWeather.mockReturnValue({
        ...owmNormalizedCurrent,
        precipitation: { amount: 2.0, hours_measured: 1, type: "rain" },
      });
      weatherApiDtoMocks.currentWeather.mockReturnValue({
        ...weatherApiNormalizedCurrent,
        precipitation: { amount: 4.0, hours_measured: 1, type: "rain" },
      });

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      // avgHourlyRate = (2/1 + 4/1) / 2 = 3.0 mm/h; targetHours = 1
      expect(result.precipitation.amount).toBeCloseTo(3.0);
      expect(result.precipitation.hours_measured).toBe(1);
      expect(result.precipitation.type).toBe("rain");
    });

    it("normalizes precipitation amounts across mismatched periods (OWM 3h vs WeatherAPI 1h)", async () => {
      owmDtoMocks.currentWeather.mockReturnValue({
        ...owmNormalizedCurrent,
        precipitation: { amount: 3.0, hours_measured: 3, type: "rain" },
      });
      weatherApiDtoMocks.currentWeather.mockReturnValue({
        ...weatherApiNormalizedCurrent,
        precipitation: { amount: 1.0, hours_measured: 1, type: "rain" },
      });

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      // avgHourlyRate = (3/3 + 1/1) / 2 = 1.0 mm/h; targetHours = min(3,1) = 1
      expect(result.precipitation.amount).toBeCloseTo(1.0);
      expect(result.precipitation.hours_measured).toBe(1);
      expect(result.precipitation.type).toBe("rain");
    });

    it("returns data from WeatherAPI with an error entry when OWM fails", async () => {
      owmServiceMocks.currentWeather.mockRejectedValue(new Error("OWM down"));

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      // Only WeatherAPI data in result
      expect(result.temperature.temp).toBe(6.0);
      expect(result.providers).toEqual(["weatherapi.com"]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].provider).toBe("openweathermaps.org");
    });

    it("returns data from OWM with an error entry when WeatherAPI fails", async () => {
      weatherApiServiceMocks.currentWeather.mockRejectedValue(new Error("WeatherAPI down"));

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      // Only OWM data in result
      expect(result.temperature.temp).toBe(10.0);
      expect(result.providers).toEqual(["openweathermaps.org"]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].provider).toBe("weatherapi.com");
    });

    it("returns an error structure when both providers fail", async () => {
      owmServiceMocks.currentWeather.mockRejectedValue(new Error("OWM down"));
      weatherApiServiceMocks.currentWeather.mockRejectedValue(new Error("WeatherAPI down"));

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      expect(result.error).toBe("All weather providers failed");
      expect(result.errors).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // forecastWeather
  // -------------------------------------------------------------------------
  describe("forecastWeather", () => {
    // Override the forecast DTO mocks with forecast-specific data for every
    // test in this describe block.
    beforeEach(() => {
      owmDtoMocks.forecastWeather.mockReturnValue(owmNormalizedForecast);
      weatherApiDtoMocks.forecastWeather.mockReturnValue(weatherApiNormalizedForecast);
    });

    it("merges forecast data from both providers keyed by day and timestamp", async () => {
      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      expect(result.list).toHaveProperty("Monday");
      expect(result.list.Monday).toHaveLength(1);
    });

    it("averages numeric forecast fields at matching timestamps", async () => {
      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);
      const hour = result.list.Monday[0];

      expect(hour.temperature.temp).toBeCloseTo(8.0);  // (10 + 6) / 2
      expect(hour.humidity).toBeCloseTo(75);             // (80 + 70) / 2
      expect(hour.pressure).toBeCloseTo(1020);           // (1010 + 1030) / 2
    });

    it("prefers the WeatherAPI icon in merged forecast entries", async () => {
      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);
      const hour = result.list.Monday[0];

      expect(hour.icon).toBe("//cdn.weatherapi.com/weather/64x64/night/116.png");
    });

    it("includes both provider names in the providers array", async () => {
      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      expect(result.providers).toContain("openweathermaps.org");
      expect(result.providers).toContain("weatherapi.com");
    });

    it("handles mismatched precipitation periods (OWM 3h vs WeatherAPI 1h)", async () => {
      owmDtoMocks.forecastWeather.mockReturnValue({
        ...owmNormalizedForecast,
        list: {
          Monday: [
            { ...owmForecastHour, precipitation: { amount: 3.0, hours_measured: 3, type: "rain" } },
          ],
        },
      });
      weatherApiDtoMocks.forecastWeather.mockReturnValue({
        ...weatherApiNormalizedForecast,
        list: {
          Monday: [
            { ...weatherApiForecastHour, precipitation: { amount: 1.0, hours_measured: 1, type: "rain" } },
          ],
        },
      });

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);
      const hour = result.list.Monday[0];

      // mergeHourlyData detects mismatched periods and delegates to the most
      // granular source (1h). adjustPrecipitationAcrossHours then averages
      // the window totals: (3.0 + 1.0) / 2 = 2.0, distributed to the single
      // granular hour in the window.
      expect(hour.precipitation.hours_measured).toBe(1);
      expect(hour.precipitation.amount).toBeCloseTo(2.0);
      expect(hour.precipitation.type).toBe("rain");
    });

    it("preserves days that only one provider has data for", async () => {
      owmDtoMocks.forecastWeather.mockReturnValue({
        ...owmNormalizedForecast,
        list: {
          ...owmNormalizedForecast.list,
          Tuesday: [
            {
              ...owmForecastHour,
              dt: 1086400,
              precipitation: { amount: 1.0, hours_measured: 3, type: "rain" },
            },
          ],
        },
      });

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      expect(result.list).toHaveProperty("Monday");
      expect(result.list).toHaveProperty("Tuesday");
    });

    it("returns WeatherAPI forecast with an error entry when OWM fails", async () => {
      owmServiceMocks.forecastWeather.mockRejectedValue(new Error("OWM down"));

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      expect(result.list).toHaveProperty("Monday");
      expect(result.providers).toEqual(["weatherapi.com"]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].provider).toBe("openweathermaps.org");
    });

    it("returns OWM forecast with an error entry when WeatherAPI fails", async () => {
      weatherApiServiceMocks.forecastWeather.mockRejectedValue(new Error("WeatherAPI down"));

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      expect(result.list).toHaveProperty("Monday");
      expect(result.providers).toEqual(["openweathermaps.org"]);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].provider).toBe("weatherapi.com");
    });

    it("returns an error structure when both forecast providers fail", async () => {
      owmServiceMocks.forecastWeather.mockRejectedValue(new Error("OWM down"));
      weatherApiServiceMocks.forecastWeather.mockRejectedValue(new Error("WeatherAPI down"));

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      expect(result.error).toBe("All weather providers failed");
      expect(result.errors).toHaveLength(2);
    });
  });
});
