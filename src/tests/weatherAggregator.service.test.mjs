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

const smhiServiceMocks = {
  forecastWeather: jest.fn(),
};

const smhiDtoMocks = {
  currentWeather: jest.fn(),
  forecastWeather: jest.fn(),
};

const metServiceMocks = {
  forecastWeather: jest.fn(),
};

const metDtoMocks = {
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

jest.unstable_mockModule("../services/smhi.service.mjs", () => ({
  default: smhiServiceMocks,
}));

jest.unstable_mockModule("../services/met.service.mjs", () => ({
  default: metServiceMocks,
}));

jest.unstable_mockModule("../dtos/openWeatherMaps.dto.mjs", () => ({
  default: owmDtoMocks,
}));

jest.unstable_mockModule("../dtos/weatherApi.dto.mjs", () => ({
  default: weatherApiDtoMocks,
}));

jest.unstable_mockModule("../dtos/smhi.dto.mjs", () => ({
  default: smhiDtoMocks,
}));

jest.unstable_mockModule("../dtos/met.dto.mjs", () => ({
  default: metDtoMocks,
}));

jest.unstable_mockModule("../services/errorLog.service.mjs", () => ({
  logError: jest.fn(),
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

// SMHI values chosen so that three-way averages equal the two-way averages
// already asserted in existing tests:
//   temp:     (10 + 6 + 8)   / 3 = 8.0
//   humidity: (80 + 70 + 75) / 3 = 75.0
//   pressure: (1010+1030+1020)/3 = 1020.0
const smhiNormalizedCurrent = {
  weather: "Clear sky",
  description: "Clear sky",
  icon: null,
  dt: 1000200,
  location: {
    country_code: "SE",
    coords: { lat: 58.577821, lon: 16.158549 },
    name: null,
    timezone: "UTC",
  },
  temperature: { temp: 8.0, min: null, max: null, feels_like: null },
  pressure: 1020,
  humidity: 75,
  visibility: 13700,
  clouds: { all: 13 },
  elevation: { sea_level: null, ground_level: null },
  wind: { speed: 1.5, deg: 76, dir: null, gust: 2.9 },
  precipitation: { amount: 0.0, hours_measured: 1, type: "none" },
  sunrise: null,
  sunset: null,
  uv: null,
  provider: "smhi.se",
};

const smhiForecastHour = {
  dt: 1000000,
  weather: "Clear sky",
  description: "Clear sky",
  icon: null,
  temperature: { temp: 8.0, feels_like: null, max: null, min: null },
  pressure: 1020,
  humidity: 75,
  visibility: 13700,
  elevation: { sea_level: null, ground_level: null },
  wind: { speed: 1.5, deg: 76, dir: null, gust: 2.9 },
  clouds: { all: 13 },
  precipitation: { amount: 0.0, hours_measured: 1, type: "none" },
};

const smhiNormalizedForecast = {
  list: { Monday: [smhiForecastHour] },
  provider: "smhi.se",
};

// Yr values chosen so that four-way averages equal the three-way averages
// already asserted in existing tests:
//   temp:     (10 + 6 + 8 + 8)     / 4 = 8.0
//   humidity: (80 + 70 + 75 + 75)  / 4 = 75.0
//   pressure: (1010+1030+1020+1020) / 4 = 1020.0
const metNormalizedCurrent = {
  weather: "Partly Cloudy",
  description: "Partly Cloudy",
  icon: null,
  dt: 1000300,
  location: {
    country_code: null,
    coords: { lat: 59.4, lon: 18.0 },
    name: null,
    timezone: "UTC",
  },
  temperature: { temp: 8.0, min: null, max: null, feels_like: null },
  pressure: 1020,
  humidity: 75,
  visibility: null,
  clouds: { all: 50 },
  elevation: { sea_level: null, ground_level: null },
  wind: { speed: 1.5, deg: 76, dir: null, gust: null },
  precipitation: { amount: 0.0, hours_measured: 1, type: "none" },
  sunrise: null,
  sunset: null,
  uv: null,
  provider: "met.no",
};

const yrForecastHour = {
  dt: 1000000,
  weather: "Partly Cloudy",
  description: "Partly Cloudy",
  icon: null,
  temperature: { temp: 8.0, feels_like: null, max: null, min: null },
  pressure: 1020,
  humidity: 75,
  visibility: null,
  elevation: { sea_level: null, ground_level: null },
  wind: { speed: 1.5, deg: 76, dir: null, gust: null },
  clouds: { all: 50 },
  precipitation: { amount: 0.0, hours_measured: 1, type: "none" },
};

const metNormalizedForecast = {
  list: { Monday: [yrForecastHour] },
  provider: "met.no",
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
    smhiServiceMocks.forecastWeather.mockResolvedValue({});
    metServiceMocks.forecastWeather.mockResolvedValue({});
    owmDtoMocks.currentWeather.mockReturnValue(owmNormalizedCurrent);
    owmDtoMocks.forecastWeather.mockReturnValue(null);
    weatherApiDtoMocks.currentWeather.mockReturnValue(weatherApiNormalizedCurrent);
    weatherApiDtoMocks.forecastWeather.mockReturnValue(null);
    smhiDtoMocks.currentWeather.mockReturnValue(smhiNormalizedCurrent);
    smhiDtoMocks.forecastWeather.mockReturnValue(null);
    metDtoMocks.currentWeather.mockReturnValue(metNormalizedCurrent);
    metDtoMocks.forecastWeather.mockReturnValue(null);
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
      expect(result.providers).toContain("smhi.se");
      expect(result.providers).toContain("met.no");
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
      smhiDtoMocks.currentWeather.mockReturnValue({
        ...smhiNormalizedCurrent,
        precipitation: { amount: 3.0, hours_measured: 1, type: "rain" },
      });
      metDtoMocks.currentWeather.mockReturnValue({
        ...metNormalizedCurrent,
        precipitation: { amount: 3.0, hours_measured: 1, type: "rain" },
      });

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      // avgHourlyRate = (2/1 + 4/1 + 3/1 + 3/1) / 4 = 3.0 mm/h; targetHours = 1
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
      smhiDtoMocks.currentWeather.mockReturnValue({
        ...smhiNormalizedCurrent,
        precipitation: { amount: 1.0, hours_measured: 1, type: "rain" },
      });
      metDtoMocks.currentWeather.mockReturnValue({
        ...metNormalizedCurrent,
        precipitation: { amount: 1.0, hours_measured: 1, type: "rain" },
      });

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      // avgHourlyRate = (3/3 + 1/1 + 1/1 + 1/1) / 4 = 1.0 mm/h; targetHours = min(3,1,1,1) = 1
      expect(result.precipitation.amount).toBeCloseTo(1.0);
      expect(result.precipitation.hours_measured).toBe(1);
      expect(result.precipitation.type).toBe("rain");
    });

    it("returns data from WeatherAPI and SMHI with an error entry when OWM fails", async () => {
      owmServiceMocks.currentWeather.mockRejectedValue(new Error("OWM down"));

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      // WeatherAPI (6.0), SMHI (8.0) and Yr (8.0) are averaged
      expect(result.temperature.temp).toBeCloseTo(22 / 3);
      expect(result.providers).toEqual(expect.arrayContaining(["weatherapi.com", "smhi.se", "met.no"]));
      expect(result.providers).toHaveLength(3);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].provider).toBe("openweathermaps.org");
    });

    it("returns data from OWM and SMHI with an error entry when WeatherAPI fails", async () => {
      weatherApiServiceMocks.currentWeather.mockRejectedValue(new Error("WeatherAPI down"));

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      // OWM (10.0), SMHI (8.0) and Yr (8.0) are averaged
      expect(result.temperature.temp).toBeCloseTo(26 / 3);
      expect(result.providers).toEqual(expect.arrayContaining(["openweathermaps.org", "smhi.se", "met.no"]));
      expect(result.providers).toHaveLength(3);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].provider).toBe("weatherapi.com");
    });

    it("returns data from OWM and WeatherAPI with an error entry when SMHI fails", async () => {
      smhiServiceMocks.forecastWeather.mockRejectedValue(new Error("SMHI down"));

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      // OWM (10.0), WeatherAPI (6.0) and Yr (8.0) are averaged
      expect(result.temperature.temp).toBeCloseTo(8.0);
      expect(result.providers).toEqual(expect.arrayContaining(["openweathermaps.org", "weatherapi.com", "met.no"]));
      expect(result.providers).toHaveLength(3);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].provider).toBe("smhi.se");
    });

    it("returns an error structure when all providers fail", async () => {
      owmServiceMocks.currentWeather.mockRejectedValue(new Error("OWM down"));
      weatherApiServiceMocks.currentWeather.mockRejectedValue(new Error("WeatherAPI down"));
      smhiServiceMocks.forecastWeather.mockRejectedValue(new Error("SMHI down"));
      metServiceMocks.forecastWeather.mockRejectedValue(new Error("Yr down"));

      const result = await weatherAggregatorService.currentWeather(59.4, 18.0);

      expect(result.error).toBe("All weather providers failed");
      expect(result.errors).toHaveLength(4);
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
      smhiDtoMocks.forecastWeather.mockReturnValue(smhiNormalizedForecast);
      metDtoMocks.forecastWeather.mockReturnValue(metNormalizedForecast);
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
      expect(result.providers).toContain("smhi.se");
      expect(result.providers).toContain("met.no");
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

    it("returns WeatherAPI and SMHI forecast with an error entry when OWM fails", async () => {
      owmServiceMocks.forecastWeather.mockRejectedValue(new Error("OWM down"));

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      expect(result.list).toHaveProperty("Monday");
      expect(result.providers).toEqual(expect.arrayContaining(["weatherapi.com", "smhi.se", "met.no"]));
      expect(result.providers).toHaveLength(3);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].provider).toBe("openweathermaps.org");
    });

    it("returns OWM and SMHI forecast with an error entry when WeatherAPI fails", async () => {
      weatherApiServiceMocks.forecastWeather.mockRejectedValue(new Error("WeatherAPI down"));

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      expect(result.list).toHaveProperty("Monday");
      expect(result.providers).toEqual(expect.arrayContaining(["openweathermaps.org", "smhi.se", "met.no"]));
      expect(result.providers).toHaveLength(3);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].provider).toBe("weatherapi.com");
    });

    it("returns OWM and WeatherAPI forecast with an error entry when SMHI fails", async () => {
      smhiServiceMocks.forecastWeather.mockRejectedValue(new Error("SMHI down"));

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      expect(result.list).toHaveProperty("Monday");
      expect(result.providers).toEqual(expect.arrayContaining(["openweathermaps.org", "weatherapi.com", "met.no"]));
      expect(result.providers).toHaveLength(3);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].provider).toBe("smhi.se");
    });

    it("returns an error structure when all forecast providers fail", async () => {
      owmServiceMocks.forecastWeather.mockRejectedValue(new Error("OWM down"));
      weatherApiServiceMocks.forecastWeather.mockRejectedValue(new Error("WeatherAPI down"));
      smhiServiceMocks.forecastWeather.mockRejectedValue(new Error("SMHI down"));
      metServiceMocks.forecastWeather.mockRejectedValue(new Error("Yr down"));

      const result = await weatherAggregatorService.forecastWeather(59.4, 18.0);

      expect(result.error).toBe("All weather providers failed");
      expect(result.errors).toHaveLength(4);
    });
  });

  // -------------------------------------------------------------------------
  // allWeather
  // -------------------------------------------------------------------------
  describe("allWeather", () => {
    beforeEach(() => {
      owmDtoMocks.forecastWeather.mockReturnValue(owmNormalizedForecast);
      weatherApiDtoMocks.forecastWeather.mockReturnValue(weatherApiNormalizedForecast);
      smhiDtoMocks.forecastWeather.mockReturnValue(smhiNormalizedForecast);
      metDtoMocks.forecastWeather.mockReturnValue(metNormalizedForecast);
    });

    it("returns both currentWeather and forecastWeather", async () => {
      const result = await weatherAggregatorService.allWeather(59.4, 18.0);

      expect(result).toHaveProperty("currentWeather");
      expect(result).toHaveProperty("forecastWeather");
    });

    it("calls smhiService.forecastWeather exactly once", async () => {
      smhiServiceMocks.forecastWeather.mockClear();

      await weatherAggregatorService.allWeather(59.4, 18.0);

      expect(smhiServiceMocks.forecastWeather).toHaveBeenCalledTimes(1);
    });

    it("calls metService.forecastWeather exactly once", async () => {
      metServiceMocks.forecastWeather.mockClear();

      await weatherAggregatorService.allWeather(59.4, 18.0);

      expect(metServiceMocks.forecastWeather).toHaveBeenCalledTimes(1);
    });

    it("currentWeather averages data from all four providers", async () => {
      const result = await weatherAggregatorService.allWeather(59.4, 18.0);

      expect(result.currentWeather.temperature.temp).toBeCloseTo(8.0);
      expect(result.currentWeather.humidity).toBeCloseTo(75);
      expect(result.currentWeather.providers).toEqual(
        expect.arrayContaining(["openweathermaps.org", "weatherapi.com", "smhi.se", "met.no"])
      );
    });

    it("forecastWeather merges data from all four providers", async () => {
      const result = await weatherAggregatorService.allWeather(59.4, 18.0);

      expect(result.forecastWeather.list).toHaveProperty("Monday");
      expect(result.forecastWeather.providers).toEqual(
        expect.arrayContaining(["openweathermaps.org", "weatherapi.com", "smhi.se", "met.no"])
      );
    });

    it("propagates SMHI failure to both currentWeather and forecastWeather errors", async () => {
      smhiServiceMocks.forecastWeather.mockRejectedValue(new Error("SMHI down"));

      const result = await weatherAggregatorService.allWeather(59.4, 18.0);

      expect(result.currentWeather.errors).toHaveLength(1);
      expect(result.currentWeather.errors[0].provider).toBe("smhi.se");
      expect(result.forecastWeather.errors).toHaveLength(1);
      expect(result.forecastWeather.errors[0].provider).toBe("smhi.se");
    });

    it("propagates Yr failure to both currentWeather and forecastWeather errors", async () => {
      metServiceMocks.forecastWeather.mockRejectedValue(new Error("Yr down"));

      const result = await weatherAggregatorService.allWeather(59.4, 18.0);

      expect(result.currentWeather.errors).toHaveLength(1);
      expect(result.currentWeather.errors[0].provider).toBe("met.no");
      expect(result.forecastWeather.errors).toHaveLength(1);
      expect(result.forecastWeather.errors[0].provider).toBe("met.no");
    });

    it("currentWeather and forecastWeather errors are independent when different providers fail", async () => {
      owmServiceMocks.currentWeather.mockRejectedValue(new Error("OWM current down"));
      weatherApiServiceMocks.forecastWeather.mockRejectedValue(new Error("WeatherAPI forecast down"));

      const result = await weatherAggregatorService.allWeather(59.4, 18.0);

      expect(result.currentWeather.errors[0].provider).toBe("openweathermaps.org");
      expect(result.forecastWeather.errors[0].provider).toBe("weatherapi.com");
    });
  });
});
