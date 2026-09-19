import { OWM_API_URL } from '../../utils/constants.mjs';
import { providerFetch } from '../../utils/providerFetch.mjs';
import { withCache } from '../infrastructure/redis.service.mjs';

const OWM_CACHE_TTL = 600; // 10 minutes

const owmFetch = (path, query) => {
  const params = new URLSearchParams({ ...query, appid: process.env.OWM_API_KEY });
  return providerFetch('OpenWeatherMap', `${OWM_API_URL}${path}?${params}`);
};

// OpenWeatherMap only supplies air pollution. It no longer takes part in the
// weather aggregation pipeline.
const openWeatherMapsService = {
  currentPollution: query =>
    withCache(`owm:pollution:current:${query.lat}:${query.lon}`, OWM_CACHE_TTL, () =>
      owmFetch('/air_pollution', query),
    ),

  forecastPollution: query =>
    withCache(`owm:pollution:forecast:${query.lat}:${query.lon}`, OWM_CACHE_TTL, () =>
      owmFetch('/air_pollution/forecast', query),
    ),
};

export default openWeatherMapsService;
