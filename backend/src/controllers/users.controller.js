// controllers/users/users.controller.js
const UserService = require('../../services/user.service');
const AuthService = require('../../services/auth.service');
const { catchAsync } = require('../../middleware/error.middleware');

/**
 * Controller pentru utilizatori
 * Gestionează cererile HTTP și folosește UserService și AuthService pentru logica de business
 */
class UsersController {
    /**
     * Înregistrează un utilizator nou
     * 
     * @route POST /api/users/register
     * @param {Object} req - Express request object
     * @param {Object} req.body - Datele de înregistrare
     * @param {string} req.body.username - Username-ul dorit
     * @param {string} req.body.password - Parola dorită
     * @param {Object} res - Express response object
     * 
     * @example
     * // Request body
     * {
     *   "username": "john_doe",
     *   "password": "SecurePass123"
     * }
     * 
     * // Response
     * {
     *   "message": "Utilizator creat cu succes!",
     *   "user": {
     *     "id": "123abc",
     *     "username": "john_doe"
     *   }
     * }
     */
    register = catchAsync(async (req, res) => {
        // Verificăm mai întâi dacă username-ul este disponibil
        const isAvailable = await UserService.checkUsernameAvailability(req.body.username);
        if (!isAvailable) {
            return res.status(400).json({ message: 'Username-ul este deja utilizat' });
        }

        // Înregistrăm utilizatorul folosind AuthService
        const user = await AuthService.register(req.body);
        
        res.status(201).json({
            message: 'Utilizator creat cu succes!',
            user
        });
    });

    /**
     * Autentifică un utilizator existent
     * 
     * @route POST /api/users/login
     * @param {Object} req - Express request object
     * @param {Object} req.body - Credențialele de autentificare
     * @param {string} req.body.username - Username-ul utilizatorului
     * @param {string} req.body.password - Parola utilizatorului
     * @param {Object} res - Express response object
     * 
     * @example
     * // Request body
     * {
     *   "username": "john_doe",
     *   "password": "SecurePass123"
     * }
     * 
     * // Response
     * {
     *   "token": "jwt.token.here",
     *   "user": {
     *     "id": "123abc",
     *     "username": "john_doe"
     *   }
     * }
     */
    login = catchAsync(async (req, res) => {
        const { username, password } = req.body;
        const { token, user } = await AuthService.login(username, password);
        res.json({ token, user });
    });

    /**
     * Obține detaliile utilizatorului curent
     * 
     * @route GET /api/users/profile
     * @param {Object} req - Express request object
     * @param {Object} req.user - Utilizatorul autentificat (adăugat de middleware-ul de autentificare)
     * @param {Object} res - Express response object
     * 
     * @example
     * // Response
     * {
     *   "id": "123abc",
     *   "username": "john_doe",
     *   "createdAt": "2024-01-01T12:00:00.000Z"
     * }
     */
    getProfile = catchAsync(async (req, res) => {
        const user = await UserService.getUserProfile(req.user.id);
        res.json(user);
    });

    /**
     * Actualizează profilul utilizatorului curent
     * 
     * @route PUT /api/users/profile
     * @param {Object} req - Express request object
     * @param {Object} req.user - Utilizatorul autentificat
     * @param {Object} req.body - Datele de actualizat
     * @param {Object} res - Express response object
     * 
     * @example
     * // Request body
     * {
     *   "email": "new.email@example.com",
     *   "preferences": { "theme": "dark" }
     * }
     * 
     * // Response
     * {
     *   "id": "123abc",
     *   "username": "john_doe",
     *   "email": "new.email@example.com",
     *   "preferences": { "theme": "dark" }
     * }
     */
    updateProfile = catchAsync(async (req, res) => {
        const user = await UserService.updateProfile(req.user.id, req.body);
        res.json(user);
    });

    /**
     * Schimbă parola utilizatorului curent
     * 
     * @route POST /api/users/change-password
     * @param {Object} req - Express request object
     * @param {Object} req.user - Utilizatorul autentificat
     * @param {Object} req.body - Parolele veche și nouă
     * @param {string} req.body.currentPassword - Parola curentă
     * @param {string} req.body.newPassword - Noua parolă
     * @param {Object} res - Express response object
     * 
     * @example
     * // Request body
     * {
     *   "currentPassword": "OldPass123",
     *   "newPassword": "NewPass456"
     * }
     * 
     * // Response
     * {
     *   "message": "Parola a fost schimbată cu succes"
     * }
     */
    changePassword = catchAsync(async (req, res) => {
        const { currentPassword, newPassword } = req.body;
        await UserService.changePassword(req.user.id, currentPassword, newPassword);
        res.json({ message: 'Parola a fost schimbată cu succes' });
    });

    /**
     * Dezactivează contul utilizatorului curent
     * 
     * @route POST /api/users/deactivate
     * @param {Object} req - Express request object
     * @param {Object} req.user - Utilizatorul autentificat
     * @param {Object} req.body - Parola pentru confirmare
     * @param {string} req.body.password - Parola curentă
     * @param {Object} res - Express response object
     * 
     * @example
     * // Request body
     * {
     *   "password": "CurrentPass123"
     * }
     * 
     * // Response
     * {
     *   "message": "Contul a fost dezactivat cu succes"
     * }
     */
    deactivateAccount = catchAsync(async (req, res) => {
        await UserService.deactivateAccount(req.user.id, req.body.password);
        res.json({ message: 'Contul a fost dezactivat cu succes' });
    });
}

module.exports = new UsersController();