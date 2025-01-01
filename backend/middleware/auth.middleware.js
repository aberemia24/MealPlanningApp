// middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { AppError } = require('../utils/appError');
const constants = require('../config/constants');

/**
 * Middleware pentru protejarea rutelor
 * Verifică dacă request-ul are un token JWT valid și atașează utilizatorul la request
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @throws {401} Unauthorized - Când token-ul lipsește sau este invalid
 * @throws {403} Forbidden - Când utilizatorul nu mai este activ
 */
const protectRoute = async (req, res, next) => {
    try {
        let token;

        // Verificăm dacă există header de autorizare și începe cu "Bearer"
        if (req.headers.authorization?.startsWith("Bearer")) {
            // Extragem token-ul din header
            token = req.headers.authorization.split(" ")[1];
            
            // Logăm pentru debugging în development
            if (process.env.NODE_ENV === 'development') {
                console.log("Token extras:", token);
            }

            if (!token) {
                throw new AppError(
                    'Nu există token de autentificare', 
                    constants.STATUS_CODES.UNAUTHORIZED
                );
            }

            try {
                // Verificăm token-ul JWT
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                if (process.env.NODE_ENV === 'development') {
                    console.log("Token decodat:", decoded);
                }

                // Găsim utilizatorul în baza de date
                const user = await User.findById(decoded.id)
                    .select("-password") // Excludem parola din rezultat
                    .lean(); // Convertim la plain JavaScript object

                if (!user) {
                    throw new AppError(
                        'Token valid dar utilizatorul nu mai există',
                        constants.STATUS_CODES.UNAUTHORIZED
                    );
                }

                // Verificăm dacă utilizatorul este activ
                if (!user.isActive) {
                    throw new AppError(
                        'Contul este dezactivat',
                        constants.STATUS_CODES.FORBIDDEN
                    );
                }

                // Verificăm dacă tokenul a fost emis înainte de ultima schimbare a parolei
                if (user.passwordChangedAt && 
                    decoded.iat < user.passwordChangedAt.getTime() / 1000) {
                    throw new AppError(
                        'Parola a fost schimbată recent. Vă rugăm să vă autentificați din nou.',
                        constants.STATUS_CODES.UNAUTHORIZED
                    );
                }

                // Atașăm utilizatorul la request pentru folosire în route handlers
                req.user = user;

                // Adăugăm token-ul decodat la request pentru acces la metadata
                req.decodedToken = decoded;

                next();
            } catch (error) {
                if (error.name === 'TokenExpiredError') {
                    throw new AppError(
                        'Token-ul a expirat',
                        constants.STATUS_CODES.UNAUTHORIZED
                    );
                }

                if (error.name === 'JsonWebTokenError') {
                    throw new AppError(
                        'Token invalid',
                        constants.STATUS_CODES.UNAUTHORIZED
                    );
                }

                throw error; // Aruncăm mai departe alte erori neașteptate
            }
        } else {
            throw new AppError(
                'Autorizare eșuată. Token lipsă!',
                constants.STATUS_CODES.UNAUTHORIZED
            );
        }
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }

        console.error("Eroare în middleware-ul de autentificare:", error);
        return next(new AppError(
            'Eroare internă de server',
            constants.STATUS_CODES.INTERNAL_SERVER
        ));
    }
};

/**
 * Middleware pentru verificarea rolurilor utilizatorilor
 * @param {...string} roles - Rolurile permise
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        // Verificăm dacă avem un utilizator (setat de authMiddleware)
        if (!req.user) {
            return next(new AppError('Nu sunteți autentificat', constants.STATUS_CODES.UNAUTHORIZED));
        }

        // Verificăm dacă utilizatorul are unul din rolurile necesare
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('Nu aveți permisiunea necesară pentru această acțiune', constants.STATUS_CODES.FORBIDDEN)
            );
        }

        // Verificăm dacă contul este activ
        if (!req.user.isActive) {
            return next(
                new AppError('Contul este dezactivat. Contactați administratorul.', constants.STATUS_CODES.FORBIDDEN)
            );
        }

        next();
    };
};

/**
 * Middleware pentru verificarea dacă utilizatorul este nutritionist sau bucătar
 */
const requireNutritionistOrChef = (req, res, next) => {
    if (!req.user) {
        return next(new AppError('Nu sunteți autentificat', constants.STATUS_CODES.UNAUTHORIZED));
    }

    if (!['nutritionist', 'chef'].includes(req.user.role)) {
        return next(new AppError(
            'Această acțiune necesită rol de nutriționist sau bucătar',
            constants.STATUS_CODES.FORBIDDEN
        ));
    }
    next();
};

/**
 * Middleware pentru verificarea dacă utilizatorul este proprietarul resursei
 * sau are rol de admin
 * 
 * @param {Function} getResourceUserId - Funcție care extrage user ID-ul din resursă
 */
const requireOwnershipOrAdmin = (getResourceUserId) => {
    return async (req, res, next) => {
        const resourceUserId = await getResourceUserId(req);
        
        if (resourceUserId.toString() !== req.user._id.toString() && 
            !['admin', 'nutritionist'].includes(req.user.role)) {
            return next(new AppError(
                'Nu aveți permisiunea de a modifica această resursă',
                constants.STATUS_CODES.FORBIDDEN
            ));
        }
        next();
    };
};

module.exports = {
    protectRoute,
    authorize,
    requireNutritionistOrChef,
    requireOwnershipOrAdmin
};