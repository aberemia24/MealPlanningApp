// backend/middleware/auth.middleware.js

const AuthService = require('../services/auth.service');

/**
 * Middleware pentru protejarea rutelor
 * Verifică prezența și validitatea token-ului JWT
 */
const protectRoute = async (req, res, next) => {
    try {
        let token;

        // Verifică dacă există header de autorizare și începe cu "Bearer"
        if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ 
                message: 'Acces neautorizat. Token lipsă.' 
            });
        }

        // Verifică token-ul și atașează utilizatorul la request
        req.user = await AuthService.verifyToken(token);
        next();
    } catch (error) {
        res.status(401).json({ 
            message: error.message || 'Token invalid.' 
        });
    }
};

module.exports = { protectRoute };