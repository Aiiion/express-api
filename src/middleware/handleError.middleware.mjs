import { logError } from '../services/errorLog.service.mjs';
import { devError } from '../utils/logger.mjs';

export const handleError = async (err, req, res, next) => {
    devError('Error occurred:', err.stack || err);
    const statusCode = err.status || err.statusCode || 500;

    await logError(err, { route: req.originalUrl });
    if (res.headersSent) return next(err);

    // Do not expose internal error details for server errors
    const message = statusCode >= 500 ? 'Internal server error' : err.message;

    return res.status(statusCode).json({
        code: statusCode,
        message,
    });
}
