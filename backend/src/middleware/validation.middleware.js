// middleware/validation.middleware.js
const { validationResult } = require('express-validator');

/**
 * Middleware pentru tratarea erorilor de validare
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
    }
    next();
};

module.exports = {
    handleValidationErrors
};