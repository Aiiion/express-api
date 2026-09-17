import { getJsonValue, setJsonValue } from '../services/infrastructure/redis.service.mjs';
import { devError } from '../utils/logger.mjs';

// keyFn (optional) builds the cache key from the request — use it to key on
// sanitized/normalized params instead of the raw URL. Defaults to the URL.
export const cache = (duration, keyFn) => {
  return async (req, res, next) => {
    let key = '__express__' + (keyFn ? keyFn(req) : (req.originalUrl || req.url))
    let cachedBody = null

    try {
      cachedBody = await getJsonValue(key)
    } catch (err) {
      devError('Failed to read cache entry:', err)
    }

    if (cachedBody !== null) {
      res.send(cachedBody)
      return
    } else {
      const sendResponse = res.send.bind(res)
      res.send = (body) => {
        if (res.statusCode < 500) {
          let valueToCache = body
          if (typeof body === 'string') {
            try { valueToCache = JSON.parse(body) } catch { /* not JSON, skip caching */ valueToCache = null }
          }
          if (valueToCache !== null) {
            setJsonValue(key, valueToCache, duration)
              .catch((err) => devError('Failed to write cache entry:', err))
          }
        }
        return sendResponse(body)
      }
      next()
    }
  }
}
