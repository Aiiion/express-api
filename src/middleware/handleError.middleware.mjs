export const handleError = (err, req, res, next) => {
    console.error('Error occurred:', err.stack || err);
    if (res.headersSent) return next(err);
    const statusCode = err.status || err.statusCode || 500;
    return res.status(statusCode).json({ 
        code: statusCode,
        message: err.message, 
    });
}