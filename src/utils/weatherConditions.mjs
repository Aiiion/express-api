/**
 * A provider-independent vocabulary for weather conditions.
 *
 * Each provider describes the sky in its own words — OWM says "Clouds", SMHI
 * says "Halfclear sky", MET says "Partly Cloudy", WeatherAPI says "Partly
 * cloudy". Comparing those strings directly never finds agreement, so the
 * aggregator cannot tell consensus from coincidence. Every DTO maps its
 * provider's *structured* code (numeric id or symbol code, never the display
 * text) onto one of the codes below, and the aggregator votes on those.
 *
 * `group` is the coarse family the vote is decided on; `rank` orders intensity
 * within a family so the aggregator can take a median instead of a plurality
 * once the family is settled. Shower variants deliberately collapse into the
 * steady-precipitation codes: OWM's `main`/id scheme cannot express showers, so
 * keeping them separate would split the vote on a distinction only some
 * providers can make.
 */
export const CONDITIONS = {
    clear: { group: 'cloud', rank: 0 },
    partly_cloudy: { group: 'cloud', rank: 1 },
    cloudy: { group: 'cloud', rank: 2 },
    overcast: { group: 'cloud', rank: 3 },

    fog: { group: 'fog', rank: 0 },

    drizzle: { group: 'rain', rank: 0 },
    light_rain: { group: 'rain', rank: 1 },
    rain: { group: 'rain', rank: 2 },
    heavy_rain: { group: 'rain', rank: 3 },

    freezing_rain: { group: 'freezing', rank: 0 },

    light_sleet: { group: 'sleet', rank: 0 },
    sleet: { group: 'sleet', rank: 1 },
    heavy_sleet: { group: 'sleet', rank: 2 },

    light_snow: { group: 'snow', rank: 0 },
    snow: { group: 'snow', rank: 1 },
    heavy_snow: { group: 'snow', rank: 2 },

    hail: { group: 'hail', rank: 0 },
    thunderstorm: { group: 'thunder', rank: 0 },

    unknown: { group: 'unknown', rank: 0 },
};

// group -> { rank: code }, built once so the aggregator can resolve the
// median rank of a group back to a condition code.
const BY_GROUP_RANK = Object.entries(CONDITIONS).reduce((acc, [code, { group, rank }]) => {
    acc[group] ??= {};
    acc[group][rank] = code;
    return acc;
}, {});

/**
 * Resolves a (group, rank) pair back to its condition code.
 * @param {string} group
 * @param {number} rank
 * @returns {string|null}
 */
export const conditionFor = (group, rank) => BY_GROUP_RANK[group]?.[rank] ?? null;

/**
 * Maps an OpenWeatherMap condition id to a shared condition code.
 * The id is used rather than `weather[0].main`, which collapses every cloud
 * amount into a single "Clouds" value.
 * https://openweathermap.org/weather-conditions
 * @param {number|null|undefined} id
 * @returns {string|null} Condition code, or null when no id was supplied
 */
export const conditionFromOwmId = (id) => {
    if (typeof id !== 'number') return null;
    if (id >= 200 && id < 300) return 'thunderstorm';
    if (id >= 300 && id < 400) return 'drizzle';
    if (id === 511) return 'freezing_rain';
    if (id >= 500 && id < 600) {
        if (id === 500 || id === 520) return 'light_rain';
        if (id === 502 || id === 503 || id === 504 || id === 522 || id === 531) return 'heavy_rain';
        return 'rain';
    }
    if (id >= 600 && id < 700) {
        if (id >= 611 && id <= 616) return 'sleet';
        if (id === 600 || id === 620) return 'light_snow';
        if (id === 602 || id === 622) return 'heavy_snow';
        return 'snow';
    }
    // 701-762 are mist/smoke/haze/dust/fog/sand/ash — all "can't see far".
    // 771 (squall) and 781 (tornado) have no equivalent in the shared set.
    if (id >= 700 && id < 770) return 'fog';
    if (id === 800) return 'clear';
    if (id === 801 || id === 802) return 'partly_cloudy';
    if (id === 803) return 'cloudy';
    if (id === 804) return 'overcast';
    return 'unknown';
};

// https://www.weatherapi.com/docs/weather_conditions.json
const WEATHERAPI_CODES = {
    1000: 'clear',
    1003: 'partly_cloudy',
    1006: 'cloudy',
    1009: 'overcast',
    1030: 'fog',            // mist
    1063: 'light_rain',     // patchy rain possible
    1066: 'light_snow',
    1069: 'light_sleet',
    1072: 'freezing_rain',
    1087: 'thunderstorm',
    1114: 'snow',           // blowing snow
    1117: 'heavy_snow',     // blizzard
    1135: 'fog',
    1147: 'fog',            // freezing fog
    1150: 'drizzle', 1153: 'drizzle',
    1168: 'freezing_rain', 1171: 'freezing_rain',
    1180: 'light_rain', 1183: 'light_rain',
    1186: 'rain', 1189: 'rain',
    1192: 'heavy_rain', 1195: 'heavy_rain',
    1198: 'freezing_rain', 1201: 'freezing_rain',
    1204: 'light_sleet', 1207: 'heavy_sleet',
    1210: 'light_snow', 1213: 'light_snow',
    1216: 'snow', 1219: 'snow',
    1222: 'heavy_snow', 1225: 'heavy_snow',
    1237: 'hail',           // ice pellets
    1240: 'light_rain', 1243: 'rain', 1246: 'heavy_rain',
    1249: 'light_sleet', 1252: 'sleet',
    1255: 'light_snow', 1258: 'snow',
    1261: 'hail', 1264: 'hail',
    1273: 'thunderstorm', 1276: 'thunderstorm',
    1279: 'thunderstorm', 1282: 'thunderstorm',
};

/**
 * Maps a WeatherAPI condition code to a shared condition code.
 * @param {number|null|undefined} code
 * @returns {string|null} Condition code, or null when no code was supplied
 */
export const conditionFromWeatherApiCode = (code) => {
    if (typeof code !== 'number') return null;
    return WEATHERAPI_CODES[code] ?? 'unknown';
};

// https://opendata.smhi.se/metfcst/snow1gv1/parameters — Wsymb2 1-27.
// The shower codes (8-17) map onto the same intensities as their steady
// equivalents (18-27); see the note on CONDITIONS above.
const SMHI_SYMBOLS = {
    1: 'clear', 2: 'partly_cloudy', 3: 'partly_cloudy', 4: 'partly_cloudy',
    5: 'cloudy', 6: 'overcast', 7: 'fog',
    8: 'light_rain', 9: 'rain', 10: 'heavy_rain',
    11: 'thunderstorm',
    12: 'light_sleet', 13: 'sleet', 14: 'heavy_sleet',
    15: 'light_snow', 16: 'snow', 17: 'heavy_snow',
    18: 'light_rain', 19: 'rain', 20: 'heavy_rain',
    21: 'thunderstorm',
    22: 'light_sleet', 23: 'sleet', 24: 'heavy_sleet',
    25: 'light_snow', 26: 'snow', 27: 'heavy_snow',
};

/**
 * Maps an SMHI Wsymb2 symbol code to a shared condition code.
 * @param {number|null|undefined} symbolCode
 * @returns {string|null} Condition code, or null when no symbol was supplied
 */
export const conditionFromSmhiSymbol = (symbolCode) => {
    if (typeof symbolCode !== 'number') return null;
    return SMHI_SYMBOLS[symbolCode] ?? 'unknown';
};

/**
 * Maps a MET (Yr) symbol_code to a shared condition code.
 * MET has no "overcast" — `cloudy` is its most-clouded sky — so it always
 * votes one rank below OWM/SMHI on a fully clouded sky. That is what the
 * aggregator's median-of-rank step is there to absorb.
 * https://api.met.no/weatherapi/weathericon/2.0/documentation
 * @param {string|null|undefined} symbolCode
 * @returns {string|null} Condition code, or null when no symbol was supplied
 */
export const conditionFromMetSymbol = (symbolCode) => {
    if (!symbolCode) return null;
    const code = symbolCode.toLowerCase().replace(/_(day|night|polartwilight)$/, '');

    // "…andthunder" variants exist for most precipitation types; thunder wins.
    if (code.includes('thunder')) return 'thunderstorm';

    const intensity = code.startsWith('heavy') ? 'heavy' : code.startsWith('light') ? 'light' : null;
    // Sleet before snow before rain — "lightsleetshowers" contains none of the
    // others, but checking in the wrong order would still be fragile.
    if (code.includes('sleet')) {
        return intensity === 'heavy' ? 'heavy_sleet' : intensity === 'light' ? 'light_sleet' : 'sleet';
    }
    if (code.includes('snow')) {
        return intensity === 'heavy' ? 'heavy_snow' : intensity === 'light' ? 'light_snow' : 'snow';
    }
    if (code.includes('rain')) {
        return intensity === 'heavy' ? 'heavy_rain' : intensity === 'light' ? 'light_rain' : 'rain';
    }
    if (code === 'fog') return 'fog';
    if (code === 'clearsky') return 'clear';
    if (code === 'fair' || code === 'partlycloudy') return 'partly_cloudy';
    if (code === 'cloudy') return 'cloudy';
    return 'unknown';
};
