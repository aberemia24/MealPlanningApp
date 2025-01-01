// controllers/users.controller.js
const UserService = require('../services/user.service');
const AuthService = require('../services/auth.service');
const { AppError } = require('../utils/appError');
const { catchAsync } = require('../middleware/error.middleware');
const constants = require('../config/constants');

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
     * @param {Object} req.body.preferences - Preferințele utilizatorului
     * @param {string} req.body.preferences.menuType - Tipul de meniu (vegetarian/omnivor)
     * @param {number} req.body.preferences.numberOfPeople - Numărul de persoane
     * @param {Object} res - Express response object
     * 
     * @example
     * // Request body
     * {
     *   "username": "john_doe",
     *   "password": "SecurePass123",
     *   "preferences": {
     *     "menuType": "vegetarian",
     *     "numberOfPeople": 2
     *   }
     * }
     */
    register = catchAsync(async (req, res) => {
        // Verificăm mai întâi dacă username-ul este disponibil
        const isAvailable = await UserService.checkUsernameAvailability(req.body.username);
        if (!isAvailable) {
            throw new AppError(constants.ERROR_MESSAGES.DUPLICATE_ENTRY, constants.STATUS_CODES.BAD_REQUEST);
        }

        // Validăm preferințele
        if (!req.body.preferences || 
            !Object.values(constants.MENU_TYPES).includes(req.body.preferences.menuType) ||
            req.body.preferences.numberOfPeople < constants.VALIDATION.MIN_PEOPLE || 
            req.body.preferences.numberOfPeople > constants.VALIDATION.MAX_PEOPLE) {
            throw new AppError('Preferințe invalide', constants.STATUS_CODES.BAD_REQUEST);
        }

        // Înregistrăm utilizatorul folosind AuthService
        const user = await AuthService.register(req.body);
        
        res.status(constants.STATUS_CODES.CREATED).json({
            message: 'Utilizator creat cu succes!',
            user
        });
    });

    /**
     * Obține detaliile utilizatorului curent
     * 
     * @route GET /api/users/profile
     * @param {Object} req - Express request object
     * @param {Object} req.user - Utilizatorul autentificat 
     * @param {Object} res - Express response object
     */
    getProfile = catchAsync(async (req, res) => {
        const user = await UserService.getUserProfile(req.user.id);
        
        if (!user) {
            throw new AppError(constants.ERROR_MESSAGES.NOT_FOUND, constants.STATUS_CODES.NOT_FOUND);
        }

        res.status(constants.STATUS_CODES.OK).json({
            status: 'success',
            data: user
        });
    });

    /**
     * Actualizează profilul utilizatorului curent
     * 
     * @route PUT /api/users/profile
     * @param {Object} req - Express request object
     * @param {Object} req.user - Utilizatorul autentificat
     * @param {Object} req.body - Datele de actualizat
     * @param {Object} res - Express response object
     */
    updateProfile = catchAsync(async (req, res) => {
        // Validăm preferințele dacă sunt furnizate
        if (req.body.preferences) {
            const { menuType, numberOfPeople } = req.body.preferences;
            
            if (menuType && !Object.values(constants.MENU_TYPES).includes(menuType)) {
                throw new AppError(constants.ERROR_MESSAGES.INVALID_MENU_TYPE, constants.STATUS_CODES.BAD_REQUEST);
            }

            if (numberOfPeople && (
                numberOfPeople < constants.VALIDATION.MIN_PEOPLE || 
                numberOfPeople > constants.VALIDATION.MAX_PEOPLE
            )) {
                throw new AppError(
                    `Numărul de persoane trebuie să fie între ${constants.VALIDATION.MIN_PEOPLE} și ${constants.VALIDATION.MAX_PEOPLE}`,
                    constants.STATUS_CODES.BAD_REQUEST
                );
            }
        }

        const user = await UserService.updateProfile(req.user.id, req.body);
        
        res.status(constants.STATUS_CODES.OK).json({
            status: 'success',
            data: user
        });
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
     */
    changePassword = catchAsync(async (req, res) => {
        const { currentPassword, newPassword } = req.body;

        // Validare lungime parolă nouă
        if (newPassword.length < constants.AUTH.PASSWORD_MIN_LENGTH) {
            throw new AppError(
                `Parola trebuie să aibă cel puțin ${constants.AUTH.PASSWORD_MIN_LENGTH} caractere`,
                constants.STATUS_CODES.BAD_REQUEST
            );
        }

        await UserService.changePassword(req.user.id, currentPassword, newPassword);

        res.status(constants.STATUS_CODES.OK).json({
            status: 'success',
            message: 'Parola a fost schimbată cu succes'
        });
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
     */
    deactivateAccount = catchAsync(async (req, res) => {
        await UserService.deactivateAccount(req.user.id, req.body.password);

        res.status(constants.STATUS_CODES.OK).json({
            status: 'success',
            message: 'Contul a fost dezactivat cu succes'
        });
    });

    /**
     * Doar pentru nutriționist: Obține lista utilizatorilor care urmează un anumit tip de meniu
     * 
     * @route GET /api/users/by-menu-type
     * @param {Object} req - Express request object
     * @param {Object} req.query - Query parameters
     * @param {string} req.query.menuType - Tipul de meniu (vegetarian/omnivor)
     * @param {Object} res - Express response object
     */
    getUsersByMenuType = catchAsync(async (req, res) => {
        if (!['nutritionist', 'chef'].includes(req.user.role)) {
            throw new AppError(constants.ERROR_MESSAGES.UNAUTHORIZED, constants.STATUS_CODES.FORBIDDEN);
        }

        const { menuType } = req.query;
        if (!Object.values(constants.MENU_TYPES).includes(menuType)) {
            throw new AppError(constants.ERROR_MESSAGES.INVALID_MENU_TYPE, constants.STATUS_CODES.BAD_REQUEST);
        }

        const users = await UserService.getUsersByMenuType(menuType);

        res.status(constants.STATUS_CODES.OK).json({
            status: 'success',
            results: users.length,
            data: users
        });
    });
}

module.exports = new UsersController();