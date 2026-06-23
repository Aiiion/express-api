import { METEOALARM_FI_URL } from '../utils/constants.mjs';
import { parseXml } from '../utils/xml.mjs';
import userAgent from '../utils/userAgent.mjs';

const fmiService = {
  // lat/lon accepted for interface compatibility; FMI warnings are fetched country-wide.
  weatherWarnings: async (_lat, _lon) => {
    const response = await fetch(METEOALARM_FI_URL, {
      signal: AbortSignal.timeout(5000),
      ...userAgent,
    });
    if (!response.ok) throw new Error(`MeteoAlarm error: ${response.status} ${response.statusText}`);
    const xml = await response.text();
    return parseXml(xml);
  },
};

export default fmiService;
