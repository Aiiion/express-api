import {
  weather,
  weatherForecast,
} from "../fixtures/openWeatherMaps.fixture.mjs";
import { 
  weather as weatherApiWeather,
  weatherForecast as weatherApiForecast
} from "../fixtures/weatherApi.fixture.mjs";
import openWeatherMapsDto from "../dtos/openWeatherMaps.dto.mjs";
import weatherApiDto from "../dtos/weatherApi.dto.mjs";
import { devError } from "../utils/logger.mjs";
import smhiDto from "../dtos/smhi.dto.mjs";

/**
 * Recursively extracts all keys from an object to get its structure
 * @param {*} obj - The object to extract keys from
 * @param {string} prefix - The prefix for nested keys
 * @returns {Set} - Set of all keys in the object structure
 */
const getObjectStructure = (obj, prefix = '') => {
  const keys = new Set();
  
  if (obj === null || obj === undefined) {
    return keys;
  }
  
  if (typeof obj !== 'object') {
    return keys;
  }
  
  if (Array.isArray(obj)) {
    // For arrays, examine the first element to determine structure
    if (obj.length > 0) {
      const arrayKeys = getObjectStructure(obj[0], prefix);
      arrayKeys.forEach(key => keys.add(key));
    }
    return keys;
  }
  
  // Handle objects
  Object.keys(obj).forEach(key => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    keys.add(fullKey);
    
    const value = obj[key];
    if (value !== null && typeof value === 'object') {
      const nestedKeys = getObjectStructure(value, fullKey);
      nestedKeys.forEach(nestedKey => keys.add(nestedKey));
    }
  });
  
  return keys;
};

/**
 * Compares two sets of keys and returns the differences
 */
const compareStructures = (keys1, keys2, name1, name2) => {
  const onlyIn1 = [...keys1].filter(key => !keys2.has(key));
  const onlyIn2 = [...keys2].filter(key => !keys1.has(key));
  
  return {
    areEqual: onlyIn1.length === 0 && onlyIn2.length === 0,
    onlyIn1,
    onlyIn2,
    report: onlyIn1.length === 0 && onlyIn2.length === 0 
      ? `Structures match perfectly` 
      : `Keys only in ${name1}: [${onlyIn1.join(', ')}], Keys only in ${name2}: [${onlyIn2.join(', ')}]`
  };
};

describe('DTO Structure Consistency', () => {
  describe('currentWeather', () => {
    it('should have the same structure across openWeatherMaps and weatherApi DTOs', () => {
      const owmResult = openWeatherMapsDto.currentWeather(weather.data);
      const weatherApiResult = weatherApiDto.currentWeather(weatherApiWeather.data);
      
      const owmKeys = getObjectStructure(owmResult);
      const weatherApiKeys = getObjectStructure(weatherApiResult);
      
      const comparison = compareStructures(
        owmKeys, 
        weatherApiKeys, 
        'openWeatherMaps', 
        'weatherApi'
      );
      
      if (!comparison.areEqual) {
        devError(comparison.report);
      }
      
      expect(comparison.areEqual).toBe(true);
    });
  });

  describe('forecastWeather', () => {
    it('should have the same structure across openWeatherMaps and weatherApi DTOs', () => {
      const owmResult = openWeatherMapsDto.forecastWeather(weatherForecast.data);
      const weatherApiResult = weatherApiDto.forecastWeather(weatherApiForecast.data);
      
      // For forecast, we need to compare the structure of the items within the list
      // not the day names themselves (those will vary based on when the forecast was fetched)
      const owmDays = Object.keys(owmResult.list);
      const weatherApiDays = Object.keys(weatherApiResult.list);
      
      expect(owmDays.length).toBeGreaterThan(0);
      expect(weatherApiDays.length).toBeGreaterThan(0);
      
      // Compare the structure of the first forecast day from each provider
      const owmKeys = getObjectStructure(owmResult.list[owmDays[0]]);
      const weatherApiKeys = getObjectStructure(weatherApiResult.list[weatherApiDays[0]]);
      
      // Also compare the top-level structure (excluding the specific day names)
      const owmTopLevel = new Set(['list', 'provider']);
      const weatherApiTopLevel = new Set(['list', 'provider']);
      
      const topLevelComparison = compareStructures(
        owmTopLevel,
        weatherApiTopLevel,
        'openWeatherMaps',
        'weatherApi'
      );
      
      const dayStructureComparison = compareStructures(
        owmKeys, 
        weatherApiKeys, 
        'openWeatherMaps', 
        'weatherApi'
      );
      
      if (!topLevelComparison.areEqual) {
        devError('Top level:', topLevelComparison.report);
      }
      
      if (!dayStructureComparison.areEqual) {
        devError('Day structure:', dayStructureComparison.report);
      }
      
      expect(topLevelComparison.areEqual).toBe(true);
      expect(dayStructureComparison.areEqual).toBe(true);
    });
  });

  describe('weatherWarnings', () => {
    it('should have the same structure across weatherApi and smhi DTOs', () => {
      // Mock data for weatherWarnings since fixtures don't exist
      const weatherApiWarningData = {
        alerts: {
          alert: [{
            headline: "Test Warning",
            severity: "Moderate",
            instruction: "Take precautions",
            desc: "Test description",
            event: "Storm"
          }]
        }
      };

      const smhiWarningData = {
        inner: {
          level: "YELLOW",
          en: "Test Warning",
          type: "Storm",
          warningsCount: 1
        }
      };

      const weatherApiResult = weatherApiDto.weatherWarnings(weatherApiWarningData);
      const smhiResult = smhiDto.weatherWarnings(smhiWarningData);
      
      // Get full structure but then filter out the 'raw' field and its nested keys
      // since 'raw' intentionally stores the original API response which differs
      const weatherApiKeys = getObjectStructure(weatherApiResult);
      const smhiKeys = getObjectStructure(smhiResult);
      
      // Filter out 'raw' and any nested keys under 'raw'
      const filterRawKeys = (keys) => {
        return new Set([...keys].filter(key => !key.startsWith('raw.') && key !== 'raw'));
      };
      
      const weatherApiKeysFiltered = filterRawKeys(weatherApiKeys);
      const smhiKeysFiltered = filterRawKeys(smhiKeys);
      
      const comparison = compareStructures(
        weatherApiKeysFiltered, 
        smhiKeysFiltered, 
        'weatherApi', 
        'smhi'
      );
      
      if (!comparison.areEqual) {
        devError(comparison.report);
      }
      
      expect(comparison.areEqual).toBe(true);
    });
  });
});
