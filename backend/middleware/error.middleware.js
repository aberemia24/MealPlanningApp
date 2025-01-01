// middleware/error.middleware.js

/**
 * Clasă pentru erori operaționale
 * Folosită pentru erori care pot fi gestionate în mod controlat
 * 
 * @extends Error
 * @example
 * throw new AppError('Username-ul există deja', 400);
 */
class AppError extends Error {
    /**
     * Creează o nouă eroare aplicație
     * @param {string} message - Mesajul erorii
     * @param {number} statusCode - Codul HTTP de status
     */
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = statusCode.toString().startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Middleware pentru gestionarea erorilor asincrone
 * Înfășoară funcții async pentru a prinde erorile automat
 * 
 * @param {Function} fn - Funcția async de wrapped
 * @returns {Function} Middleware function
 * 
 * @example
 * router.get('/users', catchAsync(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 */
const catchAsync = fn => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Gestionează erorile de validare MongoDB
 * @private
 * @param {Error} err - Eroarea de validare
 * @returns {Object} Eroare formatată
 */
const handleMongoValidationError = (err) => {
    const errors = Object.values(err.errors).map(error => error.message);
    return new AppError(`Date invalide: ${errors.join('. ')}`, 400);
};

/**
 * Gestionează erori duplicate MongoDB
 * @private
 * @param {Error} err - Eroarea de duplicat
 * @returns {Object} Eroare formatată
 */
const handleDuplicateFieldsDB = (err) => {
    const field = Object.keys(err.keyValue)[0];
    return new AppError(`Valoare duplicat pentru câmpul: ${field}`, 400);
};

/**
 * Gestionează erori CastError MongoDB
 * @private
 * @param {Error} err - Eroarea de casting
 * @returns {Object} Eroare formatată
 */
const handleCastErrorDB = (err) => {
    return new AppError(`ID invalid: ${err.value}`, 400);
};

/**
 * Gestionează erori JWT
 * @private
 * @param {Error} err - Eroarea JWT
 * @returns {Object} Eroare formatată
 */
const handleJWTError = () => {
    return new AppError('Token invalid. Te rugăm să te autentifici din nou.', 401);
};

/**
 * Middleware global pentru gestionarea erorilor
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 * 
 * @example
 * app.use(errorHandler);
 */
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        // Erori detaliate în development
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // Erori simplificate în producție
        let error = { ...err };
        error.message = err.message;

        // Gestionare erori specifice MongoDB și JWT
        if (err.name === 'ValidationError') error = handleMongoValidationError(err);
        if (err.code === 11000) error = handleDuplicateFieldsDB(err);
        if (err.name === 'CastError') error = handleCastErrorDB(err);
        if (err.name === 'JsonWebTokenError') error = handleJWTError();
        
        if (error.isOperational) {
            // Erori operaționale cunoscute
            res.status(error.statusCode).json({
                status: error.status,
                message: error.message
            });
        } else {
            // Erori de programare sau necunoscute
            console.error('ERROR 💥', err);
            res.status(500).json({
                status: 'error',
                message: 'Ceva nu a mers bine!'
            });
        }
    }
};

module.exports = {
    AppError,
    catchAsync,
    errorHandler
};