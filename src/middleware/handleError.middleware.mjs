import { logError } from '../services/errorLog.service.mjs';
import { devError } from '../utils/logger.mjs';

export const handleError = async (err, req, res, next) => {
    devError('Error occurred:', err.stack || err);
    const statusCode = err.status || err.statusCode || 500;

    await logError(err, { route: req.originalUrl });
    if (res.headersSent) return next(err);

    return res.status(statusCode).json({
        code: statusCode,
        message: err.message,
    });
}
