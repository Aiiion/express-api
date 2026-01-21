import { sequelize } from '../models/index.mjs';
import { extractIp } from '../utils/ipHelpers.mjs';

// Express middleware to create a log row after response finishes.
export const logRequest = () => {
  const codeToTypeMap = (code) => {
    if (typeof code !== 'number') return 'INFO';
    if (code >= 500) return 'ERROR';
    if (code >= 400) return 'WARN';
    return 'INFO';
  };

  return (req, res, next) => {
    // capture response payloads so we can log messages on finish
    let capturedBody;
    const origJson = res.json && res.json.bind(res);
    const origSend = res.send && res.send.bind(res);
    const origEnd = res.end && res.end.bind(res);

    if (origJson) {
      res.json = function (body) {
        capturedBody = body;
        res.locals = res.locals || {};
        res.locals.__logBody = body;
        return origJson(body);
      };
    }

    if (origSend) {
      res.send = function (body) {
        capturedBody = body;
        res.locals = res.locals || {};
        res.locals.__logBody = body;
        return origSend(body);
      };
    }

    if (origEnd) {
      res.end = function (chunk, encoding, cb) {
        try {
          if (chunk) {
            // attempt to capture textual payloads
            if (Buffer.isBuffer(chunk)) capturedBody = chunk.toString('utf8');
            else capturedBody = chunk;
            res.locals = res.locals || {};
            res.locals.__logBody = capturedBody;
          }
        } catch (e) {
          // ignore capture errors
        }
        return origEnd(chunk, encoding, cb);
      };
    }

    res.on('finish', async () => {
      const Log = sequelize.models.Log;

      const data = {
        ip: extractIp(req) || null,
        route: req.originalUrl || req.url || null,
        method: req.method,
        code: res.statusCode,
        description: null,
        type: codeToTypeMap(res.statusCode),
      };

      if (data.type === 'ERROR' || data.type === 'WARN') {
        let body = (res.locals && res.locals.__logBody !== undefined) ? res.locals.__logBody : capturedBody;

        if (body) {
          try {
              if (typeof body === 'string') {
                const parsedBody = JSON.parse(body);
                if (typeof parsedBody === 'object') body = parsedBody;
              }
            }
            catch (e) { console.error(e) }
          try {
            if (typeof body === 'object') {
              if (body.message) data.description = body.message;
              else data.description = JSON.stringify(body);
            } else if (typeof body === 'string') data.description = body;
          } catch (e) {
            data.description = null;
          }
        }
      }

      try {
        await Log.create(data);
      } catch (err) {
        // don't crash the app for logging failures
        console.error('Failed to create log entry:', err);
      }
    });

    return next();
  };
};