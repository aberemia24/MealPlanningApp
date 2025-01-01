// middleware/role.middleware.js
const { AppError } = require('../utils/appError');

/**
 * Middleware pentru verificarea rolurilor utilizatorilor
 * @param {...string} roles - Rolurile permise
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        // Verificăm dacă avem un utilizator (setat de authMiddleware)
        if (!req.user) {
            return next(new AppError('Nu sunteți autentificat', 401));
        }

        // Verificăm dacă utilizatorul are unul din rolurile necesare
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('Nu aveți permisiunea necesară pentru această acțiune', 403)
            );
        }

        // Verificăm dacă contul este activ
        if (!req.user.isActive) {
            return next(
                new AppError('Contul este dezactivat. Contactați administratorul.', 403)
            );
        }

        next();
    };
};

module.exports = authorize;