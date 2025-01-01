// services/auth.service.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AppError } = require('../utils/appError');
const constants = require('../config/constants');

class AuthService {
    /**
     * Înregistrează un utilizator nou
     * @param {Object} userData - Datele utilizatorului (username, password, preferences)
     * @returns {Promise<Object>} Utilizatorul creat fără parolă
     */
    async register(userData) {
        try {
            const { username, password, preferences } = userData;

            // Verifică dacă username-ul există deja
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                throw new AppError(constants.ERROR_MESSAGES.DUPLICATE_ENTRY, constants.STATUS_CODES.BAD_REQUEST);
            }

            // Validări pentru username
            if (username.length < constants.VALIDATION.USERNAME_MIN_LENGTH || 
                username.length > constants.VALIDATION.USERNAME_MAX_LENGTH) {
                throw new AppError(
                    `Username-ul trebuie să aibă între ${constants.VALIDATION.USERNAME_MIN_LENGTH} și ${constants.VALIDATION.USERNAME_MAX_LENGTH} caractere`,
                    constants.STATUS_CODES.BAD_REQUEST
                );
            }

            // Validări pentru parolă
            if (password.length < constants.AUTH.PASSWORD_MIN_LENGTH) {
                throw new AppError(
                    `Parola trebuie să aibă cel puțin ${constants.AUTH.PASSWORD_MIN_LENGTH} caractere`,
                    constants.STATUS_CODES.BAD_REQUEST
                );
            }

            // Validări pentru preferințe (doar pentru utilizatori normali)
            if (preferences) {
                if (!Object.values(constants.MENU_TYPES).includes(preferences.menuType)) {
                    throw new AppError(constants.ERROR_MESSAGES.INVALID_MENU_TYPE, constants.STATUS_CODES.BAD_REQUEST);
                }

                if (preferences.numberOfPeople < constants.VALIDATION.MIN_PEOPLE || 
                    preferences.numberOfPeople > constants.VALIDATION.MAX_PEOPLE) {
                    throw new AppError(
                        `Numărul de persoane trebuie să fie între ${constants.VALIDATION.MIN_PEOPLE} și ${constants.VALIDATION.MAX_PEOPLE}`,
                        constants.STATUS_CODES.BAD_REQUEST
                    );
                }
            }

            // Creează utilizatorul nou
            const user = new User({
                username,
                password,
                preferences,
                role: 'user' // Rolul implicit pentru înregistrare
            });

            await user.save();

            // Returnăm utilizatorul fără parolă
            const userObject = user.toObject();
            delete userObject.password;
            
            return userObject;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(`Eroare la înregistrare: ${error.message}`, constants.STATUS_CODES.INTERNAL_SERVER);
        }
    }

    /**
     * Autentifică un utilizator
     * @param {string} username - Username-ul utilizatorului
     * @param {string} password - Parola utilizatorului
     * @returns {Promise<Object>} Token-ul JWT și datele utilizatorului
     */
    async login(username, password) {
        try {
            // Găsește utilizatorul
            const user = await User.findOne({ username });
            if (!user) {
                throw new AppError(constants.ERROR_MESSAGES.INVALID_CREDENTIALS, constants.STATUS_CODES.UNAUTHORIZED);
            }

            // Verifică dacă contul este activ
            if (!user.isActive) {
                throw new AppError('Contul este dezactivat', constants.STATUS_CODES.UNAUTHORIZED);
            }

            // Verifică parola
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                throw new AppError(constants.ERROR_MESSAGES.INVALID_CREDENTIALS, constants.STATUS_CODES.UNAUTHORIZED);
            }

            // Generează token JWT
            const token = this.generateToken(user._id);

            // Returnează datele necesare
            return {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role,
                    preferences: user.preferences
                }
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(`Eroare la autentificare: ${error.message}`, constants.STATUS_CODES.INTERNAL_SERVER);
        }
    }

    /**
     * Generează un token JWT
     * @private
     * @param {string} userId - ID-ul utilizatorului
     * @returns {string} Token-ul JWT generat
     */
    generateToken(userId) {
        return jwt.sign(
            { id: userId },
            process.env.SECRET_KEY,
            { expiresIn: '7d' }
        );
    }

    /**
     * Verifică validitatea unui token JWT
     * @param {string} token - Token-ul JWT de verificat
     * @returns {Promise<Object>} Datele utilizatorului dacă token-ul este valid
     */
    async verifyToken(token) {
        try {
            if (!token) {
                throw new AppError('Token-ul lipsește', constants.STATUS_CODES.UNAUTHORIZED);
            }

            // Verifică token-ul
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Găsește utilizatorul și exclude parola
            const user = await User.findById(decoded.id)
                .select('-password')
                .lean();

            if (!user) {
                throw new AppError('Utilizator invalid', constants.STATUS_CODES.UNAUTHORIZED);
            }

            // Verifică dacă contul este activ
            if (!user.isActive) {
                throw new AppError('Contul este dezactivat', constants.STATUS_CODES.UNAUTHORIZED);
            }

            return user;
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                throw new AppError('Token invalid', constants.STATUS_CODES.UNAUTHORIZED);
            }
            if (error.name === 'TokenExpiredError') {
                throw new AppError('Token expirat', constants.STATUS_CODES.UNAUTHORIZED);
            }
            throw error;
        }
    }

    /**
     * Actualizează datele unui utilizator
     * @param {string} userId - ID-ul utilizatorului
     * @param {Object} updateData - Noile date ale utilizatorului
     * @returns {Promise<Object>} Utilizatorul actualizat
     */
    async updateUser(userId, updateData) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new AppError(constants.ERROR_MESSAGES.NOT_FOUND, constants.STATUS_CODES.NOT_FOUND);
            }

            // Validări pentru actualizarea preferințelor
            if (updateData.preferences) {
                if (updateData.preferences.menuType && 
                    !Object.values(constants.MENU_TYPES).includes(updateData.preferences.menuType)) {
                    throw new AppError(constants.ERROR_MESSAGES.INVALID_MENU_TYPE, constants.STATUS_CODES.BAD_REQUEST);
                }

                if (updateData.preferences.numberOfPeople && 
                    (updateData.preferences.numberOfPeople < constants.VALIDATION.MIN_PEOPLE || 
                     updateData.preferences.numberOfPeople > constants.VALIDATION.MAX_PEOPLE)) {
                    throw new AppError(
                        `Numărul de persoane trebuie să fie între ${constants.VALIDATION.MIN_PEOPLE} și ${constants.VALIDATION.MAX_PEOPLE}`,
                        constants.STATUS_CODES.BAD_REQUEST
                    );
                }
            }

            // Dacă se actualizează parola, o hașurăm
            if (updateData.password) {
                const salt = await bcrypt.genSalt(10);
                updateData.password = await bcrypt.hash(updateData.password, salt);
                user.passwordChangedAt = Date.now();
            }

            Object.assign(user, updateData);
            await user.save();

            // Returnăm utilizatorul fără parolă
            const updatedUser = user.toObject();
            delete updatedUser.password;

            return updatedUser;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(`Eroare la actualizarea utilizatorului: ${error.message}`, constants.STATUS_CODES.INTERNAL_SERVER);
        }
    }
}

module.exports = new AuthService();