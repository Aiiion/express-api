import { METEOALARM_FI_URL } from '../../utils/constants.mjs';
import { parseXml } from '../../utils/xml.mjs';
import { withCache } from '../infrastructure/redis.service.mjs';
import { providerFetch } from '../../utils/providerFetch.mjs';

const FMI_WARNINGS_CACHE_TTL = 600; // 10 minutes

const fmiService = {
  // lat/lon accepted for interface compatibility; FMI warnings are fetched country-wide.
  weatherWarnings: (_lat, _lon) =>
    withCache('fmi:warnings', FMI_WARNINGS_CACHE_TTL, async () => {
      const xml = await providerFetch('MeteoAlarm', METEOALARM_FI_URL, { timeout: 5000, parse: 'text' });
      return parseXml(xml);
    }),
};

export default fmiService;
