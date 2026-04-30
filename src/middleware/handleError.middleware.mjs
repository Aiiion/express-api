import { sequelize } from '../models/index.mjs';

export const handleError = async (err, req, res, next) => {
    console.error('Error occurred:', err.stack || err);
    if (res.headersSent) return next(err);
    const statusCode = err.status || err.statusCode || 500;

    try {
        const ErrorLog = sequelize.models.ErrorLog;
        if (ErrorLog) {
            await ErrorLog.create({
                level: statusCode >= 500 ? 'ERROR' : 'WARN',
                message: err.message || 'Unknown error',
                stack_trace: err.stack || null,
                route: req.originalUrl || null,
                environment: process.env.NODE_ENV || null,
            });
        }
    } catch (logErr) {
        console.error('Failed to write error log:', logErr);
    }

    return res.status(statusCode).json({
        code: statusCode,
        message: err.message,
    });
}