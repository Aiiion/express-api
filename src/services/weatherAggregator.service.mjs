import openWeatherMapsService from "./openWeatherMaps.service.mjs";
import weatherApiService from "./weatherApi.service.mjs";
import openWeatherMapsDto from "../dtos/openWeatherMaps.dto.mjs";
import weatherApiDto from "../dtos/weatherApi.dto.mjs";

// Fields that should NOT be averaged
const NO_AVERAGE_FIELDS = new Set(['dt', 'provider', 'deg', 'dir']);

// Nested paths that should NOT be averaged (coordinates)
const NO_AVERAGE_PATHS = new Set(['location.coords', 'coords', 'wind.deg', 'wind.dir']);

/**
 * Averages numeric values from multiple sources
 * @param {Array} values - Array of values to average
 * @returns {number|null} Average value or null if no valid values
 */
const averageValues = (values) => {
  const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (validValues.length === 0) return null;
  return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
};

/**
 * Checks if a path should not be averaged
 * @param {string} path - Current path being processed
 * @param {string} parentPath - Parent path context
 * @returns {boolean}
 */
const shouldNotAverage = (key, parentPath = '') => {
  const fullPath = parentPath ? `${parentPath}.${key}` : key;
  return NO_AVERAGE_FIELDS.has(key) || NO_AVERAGE_PATHS.has(fullPath);
};

/**
 * Merges precipitation data accounting for different time periods
 * @param {Array<Object>} precipitationObjects - Array of precipitation objects from different sources
 * @returns {Object} Merged precipitation object with normalized amounts
 */
const mergePrecipitation = (precipitationObjects) => {
  if (precipitationObjects.length === 0) return null;
  if (precipitationObjects.length === 1) return precipitationObjects[0];

  const validObjects = precipitationObjects.filter(p => p && typeof p === 'object');
  if (validObjects.length === 0) return null;

  // Extract amounts and hours_measured from each source
  const precipData = validObjects.map(p => ({
    amount: p.amount ?? 0,
    hours_measured: p.hours_measured ?? 1,
    type: p.type,
  }));

  // Normalize to hourly rates
  const hourlyRates = precipData.map(p => ({
    rate: p.amount / p.hours_measured,
    hours_measured: p.hours_measured,
    type: p.type,
  }));

  // Calculate average hourly rate
  const avgHourlyRate = averageValues(hourlyRates.map(h => h.rate));

  // Determine the target hours_measured (use the most common or minimum)
  const hoursMeasured = precipData.map(p => p.hours_measured);
  const targetHours = Math.min(...hoursMeasured);

  // Calculate the amount for the target hours
  const normalizedAmount = avgHourlyRate * targetHours;

  // Determine precipitation type (take first non-"none" type, or most common)
  const types = precipData.map(p => p.type).filter(t => t && t !== 'none');
  const precipType = types.length > 0 ? types[0] : 'none';

  return {
    amount: normalizedAmount,
    hours_measured: targetHours,
    type: precipType,
  };
};

/**
 * Intelligently merges hourly forecast data with mismatched precipitation periods
 * @param {Array<Object>} hourDataArray - Array of hour data objects from different sources
 * @returns {Object} Merged hour data with properly averaged precipitation
 */
const mergeHourlyData = (hourDataArray) => {
  if (hourDataArray.length === 1) return hourDataArray[0];

  // Check if we have different hours_measured for precipitation
  const precipHours = hourDataArray
    .map(h => h.precipitation?.hours_measured)
    .filter(h => h !== undefined && h !== null);
  
  const hasMismatchedPeriods = precipHours.length > 1 && 
    new Set(precipHours).size > 1;

  if (hasMismatchedPeriods) {
    // Don't merge precipitation at individual timestamp level
    // Return averaged data but keep precipitation from the most granular source
    const merged = mergeAndAverage(hourDataArray);
    
    // Find the source with minimum hours_measured (most granular)
    const mostGranular = hourDataArray.reduce((min, curr) => {
      const currHours = curr.precipitation?.hours_measured ?? Infinity;
      const minHours = min.precipitation?.hours_measured ?? Infinity;
      return currHours < minHours ? curr : min;
    });
    
    // Use precipitation from most granular source as-is
    merged.precipitation = mostGranular.precipitation;
    return merged;
  }

  // Normal merging when periods match
  return mergeAndAverage(hourDataArray);
};

/**
 * Adjusts precipitation across multiple hours when sources have different measurement periods
 * @param {Array<Object>} mergedHours - Array of merged hourly data
 * @param {Array<Array>} sourceDayArrays - Original source arrays for the day
 * @returns {Array<Object>} Adjusted hourly data with redistributed precipitation
 */
const adjustPrecipitationAcrossHours = (mergedHours, sourceDayArrays) => {
  // Find the maximum hours_measured across all sources
  const maxHoursMeasured = Math.max(
    ...sourceDayArrays.flat().map(h => h.precipitation?.hours_measured ?? 1)
  );

  if (maxHoursMeasured <= 1) {
    // All sources use 1-hour periods, no adjustment needed
    return mergedHours;
  }

  // Group hours into windows matching maxHoursMeasured
  const windowSize = maxHoursMeasured;
  const adjustedHours = [];

  for (let i = 0; i < mergedHours.length; i += windowSize) {
    const window = mergedHours.slice(i, i + windowSize);
    
    // Calculate total precipitation in this window for each source
    const sourceTotals = sourceDayArrays.map(sourceHours => {
      const windowStart = window[0]?.dt;
      const windowEnd = window[window.length - 1]?.dt;
      
      // Find hours in this source that fall within the window
      const hoursInWindow = sourceHours.filter(h => 
        h.dt >= windowStart && h.dt <= windowEnd
      );
      
      // Sum up precipitation from this source in the window
      let total = 0;
      const seenTimestamps = new Set();
      
      hoursInWindow.forEach(h => {
        const hoursMeasured = h.precipitation?.hours_measured ?? 1;
        // Avoid double-counting if a 3-hour period spans multiple of our window hours
        if (!seenTimestamps.has(h.dt)) {
          total += (h.precipitation?.amount ?? 0);
          seenTimestamps.add(h.dt);
        }
      });
      
      return total;
    });

    // Average the totals
    const avgTotal = averageValues(sourceTotals.filter(t => t > 0));
    
    if (avgTotal === null || avgTotal === 0) {
      // No precipitation in this window
      adjustedHours.push(...window.map(h => ({
        ...h,
        precipitation: {
          ...h.precipitation,
          amount: 0,
          type: 'none',
        }
      })));
    } else {
      // Calculate the pattern from the most granular source
      const granularSource = sourceDayArrays.find(src => 
        src.some(h => h.precipitation?.hours_measured === 1)
      );
      
      if (granularSource) {
        // Get the pattern of precipitation distribution
        const windowStart = window[0]?.dt;
        const windowEnd = window[window.length - 1]?.dt;
        const granularWindow = granularSource.filter(h => 
          h.dt >= windowStart && h.dt <= windowEnd
        );
        
        const granularTotal = granularWindow.reduce((sum, h) => 
          sum + (h.precipitation?.amount ?? 0), 0
        );
        
        // Redistribute averaged total according to granular pattern
        window.forEach((hour, idx) => {
          const granularHour = granularWindow[idx];
          if (granularHour && granularTotal > 0) {
            const proportion = (granularHour.precipitation?.amount ?? 0) / granularTotal;
            adjustedHours.push({
              ...hour,
              precipitation: {
                ...hour.precipitation,
                amount: avgTotal * proportion,
                hours_measured: 1,
              }
            });
          } else {
            adjustedHours.push(hour);
          }
        });
      } else {
        // No granular source, distribute evenly
        const perHour = avgTotal / window.length;
        adjustedHours.push(...window.map(h => ({
          ...h,
          precipitation: {
            ...h.precipitation,
            amount: perHour,
            hours_measured: 1,
          }
        })));
      }
    }
  }

  return adjustedHours;
};

/**
 * Merges and averages data from multiple sources
 * @param {Array<Object>} sources - Array of data objects to merge
 * @param {string} parentPath - Parent path for nested objects
 * @returns {Object} Merged object with averaged numeric values
 */
const mergeAndAverage = (sources, parentPath = '') => {
  if (sources.length === 0) return null;
  if (sources.length === 1) return sources[0];

  const result = {};
  const allKeys = new Set();
  
  // Collect all keys from all sources
  sources.forEach(source => {
    if (source && typeof source === 'object') {
      Object.keys(source).forEach(key => allKeys.add(key));
    }
  });

  // Process each key
  allKeys.forEach(key => {
    const values = sources.map(source => source?.[key]).filter(v => v !== undefined);
    
    if (values.length === 0) return;

    // Handle different value types
    // Find first non-null value to determine type (null could mask actual numeric values)
    const firstNonNullValue = values.find(v => v !== null);
    const firstValue = firstNonNullValue !== undefined ? firstNonNullValue : values[0];
    
    // Special handling for fields that should not be averaged
    if (shouldNotAverage(key, parentPath)) {
      if (key === 'dt') {
        // For timestamps, take the most recent (maximum)
        result[key] = Math.max(...values.filter(v => typeof v === 'number'));
      } else if (key === 'provider') {
        // Skip provider field here - will be handled at top level
        return;
      } else {
        // For coordinates and other non-averaged fields, take first valid value
        result[key] = values.find(v => v !== null && v !== undefined) || null;
      }
    } else if (typeof firstValue === 'number') {
      // Average numeric values
      result[key] = averageValues(values);
    } else if (typeof firstValue === 'string') {
      // Special handling for icon - prefer WeatherAPI
      if (key === 'icon') {
        // Try to find WeatherAPI icon (contains 'weatherapi.com' in URL)
        const weatherApiIcon = values.find(v => 
          v && typeof v === 'string' && v.includes('weatherapi.com')
        );
        result[key] = weatherApiIcon || values.find(v => v !== null && v !== undefined) || null;
      } else {
        // Take first non-null string value
        result[key] = values.find(v => v !== null && v !== undefined) || null;
      }
    } else if (typeof firstValue === 'object' && firstValue !== null) {
      if (Array.isArray(firstValue)) {
        // For arrays, take the first available array
        result[key] = firstValue;
      } else {
        // Check if this is a precipitation object
        const isPrecipitation = key === 'precipitation' || 
          (firstValue.amount !== undefined && firstValue.hours_measured !== undefined);
        
        if (isPrecipitation) {
          // Use special precipitation merging logic
          result[key] = mergePrecipitation(values.filter(v => v !== null && v !== undefined));
        } else {
          // Recursively merge nested objects
          const fullPath = parentPath ? `${parentPath}.${key}` : key;
          result[key] = mergeAndAverage(
            values.filter(v => v !== null && v !== undefined),
            fullPath
          );
        }
      }
    } else {
      // For other types (boolean, null, etc.), take first value
      result[key] = firstValue;
    }
  });

  return result;
};

/**
 * Merges forecast data from multiple sources, averaging by day and timestamp
 * @param {Array<Object>} sources - Array of forecast objects with 'list' property
 * @returns {Object} Merged forecast with averaged values per day
 */
const mergeForecastData = (sources) => {
  if (sources.length === 0) return null;
  if (sources.length === 1) return sources[0];

  const mergedList = {};
  const allDays = new Set();

  // Collect all days from all sources
  sources.forEach(source => {
    if (source?.list) {
      Object.keys(source.list).forEach(day => allDays.add(day));
    }
  });

  // Merge data for each day
  allDays.forEach(day => {
    const dayArrays = sources
      .filter(source => source?.list?.[day])
      .map(source => source.list[day]);
    
    if (dayArrays.length === 0) return;
    
    // Group hourly forecasts by timestamp across all sources
    const timestampMap = new Map();
    
    dayArrays.forEach(hourArray => {
      if (Array.isArray(hourArray)) {
        hourArray.forEach(hourData => {
          const timestamp = hourData.dt;
          if (!timestampMap.has(timestamp)) {
            timestampMap.set(timestamp, []);
          }
          timestampMap.get(timestamp).push(hourData);
        });
      }
    });
    
    // Average data for each timestamp using intelligent merging
    const mergedHours = [];
    timestampMap.forEach((hourDataArray, timestamp) => {
      if (hourDataArray.length === 1) {
        // Only one source has this timestamp, use it directly
        mergedHours.push(hourDataArray[0]);
      } else {
        // Multiple sources have this timestamp, use intelligent merging
        const averaged = mergeHourlyData(hourDataArray);
        mergedHours.push(averaged);
      }
    });
    
    // Sort by timestamp
    mergedHours.sort((a, b) => a.dt - b.dt);
    
    // Adjust precipitation across hours to account for different measurement periods
    const adjustedHours = adjustPrecipitationAcrossHours(mergedHours, dayArrays);
    
    mergedList[day] = adjustedHours;
  });

  return {
    list: mergedList,
  };
};

const weatherAggregatorService = {
  /**
   * Aggregates current weather data from multiple sources
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {boolean} metric - Use metric units (default: true)
   * @returns {Promise<Object>} Averaged weather data from all sources
   */
  currentWeather: async (lat, lon, metric = true) => {
    const sources = [];
    const errors = [];
    const providers = [];

    // Fetch from OpenWeatherMaps
    try {
      const owmQuery = {
        lat,
        lon,
        units: metric ? "metric" : "imperial",
      };
      const owmData = await openWeatherMapsService.currentWeather(owmQuery);
      const normalizedOwm = openWeatherMapsDto.currentWeather(owmData);
      
      if (normalizedOwm) {
        sources.push(normalizedOwm);
        providers.push(normalizedOwm.provider || "openweathermaps.org");
      }
    } catch (error) {
      errors.push({
        provider: "openweathermaps.org",
        message: error.message,
      });
    }

    // Fetch from WeatherAPI
    try {
      const weatherApiData = await weatherApiService.currentWeather(lat, lon);
      const normalizedWeatherApi = weatherApiDto.currentWeather(weatherApiData, metric);
      
      if (normalizedWeatherApi) {
        sources.push(normalizedWeatherApi);
        providers.push(normalizedWeatherApi.provider || "weatherapi.com");
      }
    } catch (error) {
      errors.push({
        provider: "weatherapi.com",
        message: error.message,
      });
    }

    // Merge and average the data
    const averaged = mergeAndAverage(sources);

    // If both providers failed, return error structure
    if (!averaged) {
      return {
        error: "All weather providers failed",
        errors,
      };
    }

    return {
      ...averaged,
      providers,
      errors: errors.length > 0 ? errors : undefined,
    };
  },

  /**
   * Aggregates forecast weather data from multiple sources
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {boolean} metric - Use metric units (default: true)
   * @param {number} days - Number of days to forecast (default: 3)
   * @returns {Promise<Object>} Averaged forecast data from all sources
   */
  forecastWeather: async (lat, lon, metric = true, days = 3) => {
    const sources = [];
    const errors = [];
    const providers = [];

    // Fetch from OpenWeatherMaps
    try {
      const owmQuery = {
        lat,
        lon,
        units: metric ? "metric" : "imperial",
      };
      const owmData = await openWeatherMapsService.forecastWeather(owmQuery);
      const normalizedOwm = openWeatherMapsDto.forecastWeather(owmData);
      
      if (normalizedOwm) {
        sources.push(normalizedOwm);
        providers.push(normalizedOwm.provider || "openweathermaps.org");
      }
    } catch (error) {
      errors.push({
        provider: "openweathermaps.org",
        message: error.message,
      });
    }

    // Fetch from WeatherAPI
    try {
      const weatherApiData = await weatherApiService.forecastWeather(lat, lon, days);
      const normalizedWeatherApi = weatherApiDto.forecastWeather(weatherApiData, metric);
      
      if (normalizedWeatherApi) {
        sources.push(normalizedWeatherApi);
        providers.push(normalizedWeatherApi.provider || "weatherapi.com");
      }
    } catch (error) {
      errors.push({
        provider: "weatherapi.com",
        message: error.message,
      });
    }

    // Merge forecast data
    const merged = mergeForecastData(sources);

    // If both providers failed, return error structure
    if (!merged) {
      return {
        error: "All weather providers failed",
        errors,
      };
    }

    return {
      ...merged,
      providers,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};

export default weatherAggregatorService;
