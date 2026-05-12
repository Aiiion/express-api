import { getJsonValue, setJsonValue } from '../services/redis.service.mjs';
import { devError } from '../utils/logger.mjs';

export const cache = (duration) => {
  return async (req, res, next) => {
    if(process.env.NODE_ENV === 'test')
      return next()

    let key = '__express__' + (req.originalUrl || req.url)
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
        setJsonValue(key, body, duration)
          .catch((err) => devError('Failed to write cache entry:', err))
        return sendResponse(body)
      }
      next()
    }
  }
}
