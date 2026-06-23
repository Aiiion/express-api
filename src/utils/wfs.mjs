import { parseXml } from './xml.mjs';
import userAgent from './userAgent.mjs';

/**
 * Fetches a WFS 2.0 endpoint using the BsWfs simple-feature storedquery format
 * (http://xml.fmi.fi/schema/wfs/2.0) and pivots the flat parameter list into
 * an array of time-keyed objects: [{ time, lat, lon, <ParameterName>: value, ... }].
 *
 * @param {string} baseUrl  - WFS service base URL (no query string)
 * @param {Object} params   - Query params merged with the required WFS keys
 * @param {number} timeout  - Fetch timeout in ms (default 5000)
 * @returns {Promise<{ timeSeries: Array<Object> }>}
 */
export const fetchWfsBsSimple = async (baseUrl, params, timeout = 5000) => {
  const query = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    ...params,
  });

  const response = await fetch(`${baseUrl}?${query}`, {
    signal: AbortSignal.timeout(timeout),
    ...userAgent,
  });
  if (!response.ok) throw new Error(`WFS error: ${response.status} ${response.statusText}`);

  const xml = await response.text();
  const parsed = parseXml(xml);

  if (parsed.ExceptionReport) {
    const msg = [].concat(parsed.ExceptionReport?.Exception?.ExceptionText ?? []).join(' ');
    throw new Error(`WFS exception: ${msg}`);
  }

  return pivotBsSimple(parsed);
};

const pivotBsSimple = (parsed) => {
  const members = [].concat(parsed?.FeatureCollection?.member ?? []);
  const timeMap = new Map();

  for (const m of members) {
    const el = m?.BsWfsElement;
    if (!el) continue;

    const time = el.Time;
    if (!time) continue;

    if (!timeMap.has(time)) {
      const pos = String(el.Location?.Point?.pos ?? '').trim().split(/\s+/);
      timeMap.set(time, {
        time,
        lat: pos[0] != null ? parseFloat(pos[0]) : null,
        lon: pos[1] != null ? parseFloat(pos[1]) : null,
      });
    }

    const name = el.ParameterName;
    const raw = el.ParameterValue;
    if (name) {
      const num = parseFloat(raw);
      timeMap.get(time)[name] = isNaN(num) ? null : num;
    }
  }

  return {
    timeSeries: [...timeMap.values()].sort((a, b) => (a.time < b.time ? -1 : 1)),
  };
};
