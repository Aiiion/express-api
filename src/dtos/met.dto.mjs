import { translateEpochDate } from "../utils/dateTimeHelpers.mjs";
import { celsiusToFahrenheit, msToMph, mmToInches } from "../utils/mathHelpers.mjs";

// Strip time-of-day variant suffix and format as a readable string
const mapSymbolCode = (symbolCode) => {
    if (!symbolCode) return null;
    return symbolCode
        .replace(/_(day|night|polartwilight)$/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
};

const mapPrecipitationType = (symbolCode, precipAmount) => {
    if (!precipAmount || precipAmount === 0) return "none";
    if (!symbolCode) return "rain";
    const code = symbolCode.toLowerCase();
    if (code.includes("snow")) return "snow";
    if (code.includes("hail")) return "hail";
    return "rain"; // covers rain, sleet, and shower variants
};

const mapTimeSeriesEntry = (entry, metric = true) => {
    const { time, data } = entry;
    const dt = Math.floor(new Date(time).getTime() / 1000);
    const instant = data.instant.details;

    // Prefer next_1_hours (hourly) for precision, fall back to next_6_hours
    const next1 = data.next_1_hours;
    const next6 = data.next_6_hours;
    const precipSource = next1 ?? next6 ?? null;
    const hoursMeasured = next1 != null ? 1 : next6 != null ? 6 : undefined;

    const precipAmount = precipSource?.details?.precipitation_amount ?? 0;
    const symbolCode = next1?.summary?.symbol_code ?? next6?.summary?.symbol_code ?? null;
    const weatherDesc = mapSymbolCode(symbolCode);
    const precipType = mapPrecipitationType(symbolCode, precipAmount);

    return {
        dt,
        weather: weatherDesc,
        description: weatherDesc,
        icon: null,
        temperature: {
            temp: instant.air_temperature != null
                ? (metric ? instant.air_temperature : celsiusToFahrenheit(instant.air_temperature))
                : null,
            feels_like: null,
            max: null,
            min: null,
        },
        pressure: instant.air_pressure_at_sea_level ?? null,
        humidity: instant.relative_humidity ?? null,
        visibility: null,
        clouds: {
            all: instant.cloud_area_fraction != null ? Math.round(instant.cloud_area_fraction) : null,
        },
        elevation: {
            sea_level: null,
            ground_level: null,
        },
        wind: {
            speed: instant.wind_speed != null
                ? (metric ? instant.wind_speed : msToMph(instant.wind_speed))
                : null,
            deg: instant.wind_from_direction ?? null,
            dir: null,
            gust: null,
        },
        precipitation: {
            amount: metric ? precipAmount : mmToInches(precipAmount),
            hours_measured: hoursMeasured,
            type: precipType,
        },
    };
};

// riskMatrixColor values: "Yellow", "Orange", "Red"
const mapSeverity = (riskMatrixColor) => {
    switch (riskMatrixColor?.toLowerCase()) {
        case 'yellow': return "YELLOW";
        case 'orange': return "ORANGE";
        case 'red':    return "RED";
        default:       return "NONE";
    }
};

const SEVERITY_PRIORITY = { RED: 3, ORANGE: 2, YELLOW: 1, NONE: 0 };

const metDto = {
    currentWeather: (data, metric = true) => {
        if (!data?.properties?.timeseries?.length) return null;
        const coords = data.geometry?.coordinates
            ? { lat: data.geometry.coordinates[1], lon: data.geometry.coordinates[0] }
            : null;
        const entry = data.properties.timeseries[0];
        return {
            ...mapTimeSeriesEntry(entry, metric),
            location: {
                country_code: null,
                coords,
                name: null,
                timezone: "UTC",
            },
            sunrise: null,
            sunset: null,
            uv: null,
            provider: "met.no",
        };
    },

    forecastWeather: (data, metric = true, timezone = 'UTC') => {
        if (!data?.properties?.timeseries) return null;
        const now = Math.floor(Date.now() / 1000);
        const formatted = {};

        for (const entry of data.properties.timeseries) {
            const dt = Math.floor(new Date(entry.time).getTime() / 1000);
            if (dt <= now) continue;

            const day = translateEpochDate(dt, timezone);
            if (!formatted[day]) formatted[day] = [];
            formatted[day].push(mapTimeSeriesEntry(entry, metric));
        }

        return { list: formatted, provider: "met.no" };
    },

    weatherWarnings: (data) => {
        if (!data?.features?.length) return null;

        // Sort features by severity so the most severe is first
        const sorted = [...data.features].sort((a, b) => {
            const sa = SEVERITY_PRIORITY[mapSeverity(a.properties?.riskMatrixColor)] ?? 0;
            const sb = SEVERITY_PRIORITY[mapSeverity(b.properties?.riskMatrixColor)] ?? 0;
            return sb - sa;
        });

        const props = sorted[0].properties;

        return {
            severity: mapSeverity(props?.riskMatrixColor),
            severityDescription: props?.instruction ?? props?.consequences ?? null,
            title: props?.eventAwarenessName ?? props?.title ?? null,
            description: props?.description ?? null,
            type: props?.event ?? null,
            warningsCount: data.features.length,
            raw: data.features,
            provider: "met.no",
        };
    },
};

export default metDto;
