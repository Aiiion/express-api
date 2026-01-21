export const handleError = (err, req, res, next) => {
    console.error('Error occurred:', err.stack || err);
    return res.status(500).json({ 
        code: 500,
        message: err.message, 
    });
}