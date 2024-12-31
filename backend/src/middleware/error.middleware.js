// backend/middleware/error.middleware.js

/**
 * Middleware pentru gestionarea erorilor asincrone
 * @param {Function} fn - Funcția async de wrapped
 * @returns {Function} Middleware function
 */
const catchAsync = fn => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Middleware pentru gestionarea erorilor
 * @param {Error} err - Obiectul error
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Server error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = {
    catchAsync,
    errorHandler
};