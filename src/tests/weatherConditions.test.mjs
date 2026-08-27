import {
  CONDITIONS,
  conditionFor,
  conditionFromOwmId,
  conditionFromWeatherApiCode,
  conditionFromSmhiSymbol,
  conditionFromMetSymbol,
} from "../utils/weatherConditions.mjs";

describe("weatherConditions", () => {
  // The whole point of the shared vocabulary is that the same sky produces the
  // same code from every provider. Each row below is one real sky, expressed in
  // each provider's own structured code, taken from their published tables.
  describe("providers agree on the same sky", () => {
    const scenarios = [
      { sky: "clear sky",        owm: 800, weatherApi: 1000, smhi: 1,  met: "clearsky_day",        expected: "clear" },
      { sky: "moderate rain",    owm: 501, weatherApi: 1189, smhi: 19, met: "rain",                expected: "rain" },
      { sky: "light rain showers", owm: 520, weatherApi: 1240, smhi: 8, met: "lightrainshowers_day", expected: "light_rain" },
      { sky: "heavy snow",       owm: 602, weatherApi: 1225, smhi: 27, met: "heavysnow",           expected: "heavy_snow" },
      { sky: "sleet",            owm: 611, weatherApi: 1252, smhi: 23, met: "sleet",               expected: "sleet" },
      { sky: "fog",              owm: 741, weatherApi: 1135, smhi: 7,  met: "fog",                 expected: "fog" },
      { sky: "thunder",          owm: 200, weatherApi: 1087, smhi: 21, met: "rainandthunder",      expected: "thunderstorm" },
    ];

    it.each(scenarios)("maps $sky to $expected for every provider", ({ owm, weatherApi, smhi, met, expected }) => {
      expect(conditionFromOwmId(owm)).toBe(expected);
      expect(conditionFromWeatherApiCode(weatherApi)).toBe(expected);
      expect(conditionFromSmhiSymbol(smhi)).toBe(expected);
      expect(conditionFromMetSymbol(met)).toBe(expected);
    });

    it("puts a fully clouded sky in one group even though MET has no 'overcast'", () => {
      const codes = [
        conditionFromOwmId(804),
        conditionFromWeatherApiCode(1009),
        conditionFromSmhiSymbol(6),
        conditionFromMetSymbol("cloudy"),
      ];

      // MET tops out at "cloudy", so the codes differ by one rank — the vote
      // still lands in the same group, which is what decides the winner
      expect(new Set(codes.map(c => CONDITIONS[c].group))).toEqual(new Set(["cloud"]));
      expect(codes).toEqual(["overcast", "overcast", "overcast", "cloudy"]);
    });
  });

  describe("conditionFromMetSymbol", () => {
    it("strips every time-of-day variant suffix", () => {
      expect(conditionFromMetSymbol("partlycloudy_day")).toBe("partly_cloudy");
      expect(conditionFromMetSymbol("partlycloudy_night")).toBe("partly_cloudy");
      expect(conditionFromMetSymbol("partlycloudy_polartwilight")).toBe("partly_cloudy");
    });

    it("lets thunder win over the precipitation type it is combined with", () => {
      expect(conditionFromMetSymbol("lightsleetshowersandthunder_day")).toBe("thunderstorm");
      expect(conditionFromMetSymbol("heavysnowandthunder")).toBe("thunderstorm");
    });

    it("reads sleet as sleet rather than as the snow or rain it contains", () => {
      expect(conditionFromMetSymbol("lightsleet")).toBe("light_sleet");
      expect(conditionFromMetSymbol("heavysleetshowers_night")).toBe("heavy_sleet");
    });
  });

  describe("unrecognised input", () => {
    it("returns null when a provider supplied no code at all", () => {
      expect(conditionFromOwmId(undefined)).toBeNull();
      expect(conditionFromWeatherApiCode(null)).toBeNull();
      expect(conditionFromSmhiSymbol(undefined)).toBeNull();
      expect(conditionFromMetSymbol(null)).toBeNull();
    });

    it("returns 'unknown' for a code outside the mapped set", () => {
      expect(conditionFromOwmId(781)).toBe("unknown");   // tornado
      expect(conditionFromWeatherApiCode(9999)).toBe("unknown");
      expect(conditionFromSmhiSymbol(99)).toBe("unknown");
      expect(conditionFromMetSymbol("meteorshower")).toBe("unknown");
    });
  });

  describe("conditionFor", () => {
    it("resolves a group and rank back to its code", () => {
      expect(conditionFor("rain", 2)).toBe("rain");
      expect(conditionFor("cloud", 0)).toBe("clear");
    });

    it("returns null for a rank the group does not have", () => {
      expect(conditionFor("fog", 3)).toBeNull();
      expect(conditionFor("nonexistent", 0)).toBeNull();
    });
  });

  it("gives every condition a group and a rank the reverse lookup can find", () => {
    for (const [code, { group, rank }] of Object.entries(CONDITIONS)) {
      expect(conditionFor(group, rank)).toBe(code);
    }
  });
});
