import { logError } from '../services/errorLog.service.mjs';
import { devError } from '../utils/logger.mjs';

export const handleError = async (err, req, res, next) => {
    devError('Error occurred:', err.stack || err);
    if (res.headersSent) return next(err);
    const statusCode = err.status || err.statusCode || 500;

    await logError(err, { route: req.originalUrl });

    return res.status(statusCode).json({
        code: statusCode,
        message: err.message,
    });
}