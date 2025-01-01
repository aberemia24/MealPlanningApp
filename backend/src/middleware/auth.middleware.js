// middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware pentru protejarea rutelor
 * Verifică dacă request-ul are un token JWT valid și atașează utilizatorul la request
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * 
 * @example
 * // Folosire în route:
 * router.get('/protected-route', protectRoute, (req, res) => {
 *   // req.user este disponibil aici
 *   res.json({ user: req.user });
 * });
 * 
 * @throws {401} Unauthorized - Când token-ul lipsește sau este invalid
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
                return res.status(401).json({
                    success: false,
                    message: "Nu există token de autentificare"
                });
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
                    return res.status(401).json({
                        success: false,
                        message: "Token valid dar utilizatorul nu mai există"
                    });
                }

                // Verificăm dacă utilizatorul este activ
                if (user.isActive === false) {
                    return res.status(401).json({
                        success: false,
                        message: "Contul este dezactivat"
                    });
                }

                // Verificăm dacă tokenul a fost emis înainte de ultima schimbare a parolei
                if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
                    return res.status(401).json({
                        success: false,
                        message: "Parola a fost schimbată recent. Vă rugăm să vă autentificați din nou."
                    });
                }

                // Atașăm utilizatorul la request pentru folosire în route handlers
                req.user = user;

                // Adăugăm token-ul decodat la request pentru acces la metadata
                req.decodedToken = decoded;

                next();
            } catch (error) {
                if (error.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        success: false,
                        message: "Token-ul a expirat"
                    });
                }

                if (error.name === 'JsonWebTokenError') {
                    return res.status(401).json({
                        success: false,
                        message: "Token invalid"
                    });
                }

                throw error; // Aruncăm mai departe alte erori neașteptate
            }
        } else {
            return res.status(401).json({
                success: false,
                message: "Autorizare eșuată. Token lipsă!"
            });
        }
    } catch (error) {
        console.error("Eroare în middleware-ul de autentificare:", error);
        return res.status(500).json({
            success: false,
            message: "Eroare internă de server",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = protectRoute;