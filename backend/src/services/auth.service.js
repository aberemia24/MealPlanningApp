// services/auth.service.js

/**
 * Service pentru gestionarea autentificării
 * Gestionează logica de business pentru autentificare și înregistrare
 * 
 * Exemplu de utilizare:
 * const AuthService = require('../services/auth.service');
 * const userData = await AuthService.register({ username: "john", password: "secret123" });
 */
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class AuthService {
    /**
     * Înregistrează un utilizator nou
     * @param {Object} userData - Datele utilizatorului (username, password)
     * @returns {Promise<Object>} Utilizatorul creat fără parolă
     * 
     * @example
     * const user = await authService.register({
     *   username: "john_doe",
     *   password: "SecretPass123"
     * });
     * console.log(user); // { id: "123", username: "john_doe" }
     */
    async register(userData) {
        try {
            const { username, password } = userData;

            // Verifică dacă username-ul există deja
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                throw new Error('Username-ul există deja');
            }

            // Creează utilizatorul nou
            const user = new User({
                username,
                password // Va fi hașat prin hook-ul pre-save
            });

            await user.save();

            // Returnăm utilizatorul fără parolă
            const userObject = user.toObject();
            delete userObject.password;
            
            return userObject;
        } catch (error) {
            throw new Error(`Eroare la înregistrare: ${error.message}`);
        }
    }

    /**
     * Autentifică un utilizator
     * @param {string} username - Username-ul utilizatorului
     * @param {string} password - Parola utilizatorului
     * @returns {Promise<Object>} Token-ul JWT și datele utilizatorului
     * 
     * @example
     * const authData = await authService.login("john_doe", "SecretPass123");
     * console.log(authData);
     * // {
     * //   token: "eyJhbGciOiJIUzI1NiIs...",
     * //   user: { id: "123", username: "john_doe" }
     * // }
     */
    async login(username, password) {
        try {
            // Găsește utilizatorul
            const user = await User.findOne({ username });
            if (!user) {
                throw new Error('Credențiale invalide');
            }

            // Verifică parola
            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                throw new Error('Credențiale invalide');
            }

            // Generează token JWT
            const token = this.generateToken(user._id);

            // Returnează datele necesare
            return {
                token,
                user: {
                    id: user._id,
                    username: user.username
                }
            };
        } catch (error) {
            throw new Error(`Eroare la autentificare: ${error.message}`);
        }
    }

    /**
     * Generează un token JWT
     * @param {string} userId - ID-ul utilizatorului
     * @returns {string} Token-ul JWT generat
     * @private
     * 
     * @example
     * // Folosit intern de serviciu
     * const token = this.generateToken("user123");
     */
    generateToken(userId) {
        return jwt.sign(
            { id: userId },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    }

    /**
     * Verifică validitatea unui token JWT
     * @param {string} token - Token-ul JWT de verificat
     * @returns {Promise<Object>} Datele utilizatorului dacă token-ul este valid
     * 
     * @example
     * const userData = await authService.verifyToken("eyJhbGciOiJIUzI1NiIs...");
     * if (userData) {
     *   console.log("Token valid pentru utilizatorul:", userData.username);
     * }
     */
    async verifyToken(token) {
        try {
            if (!token) {
                throw new Error('Token-ul lipsește');
            }

            // Verifică token-ul
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Găsește utilizatorul și exclude parola
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                throw new Error('Utilizator invalid');
            }

            return user;
        } catch (error) {
            throw new Error(`Token invalid: ${error.message}`);
        }
    }

    /**
     * Actualizează datele unui utilizator
     * @param {string} userId - ID-ul utilizatorului
     * @param {Object} updateData - Noile date ale utilizatorului
     * @returns {Promise<Object>} Utilizatorul actualizat
     * 
     * @example
     * const updatedUser = await authService.updateUser("user123", {
     *   username: "new_username"
     * });
     */
    async updateUser(userId, updateData) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('Utilizatorul nu a fost găsit');
            }

            // Dacă se actualizează parola, o hașurăm
            if (updateData.password) {
                const salt = await bcrypt.genSalt(10);
                updateData.password = await bcrypt.hash(updateData.password, salt);
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                updateData,
                { new: true }
            ).select('-password');

            return updatedUser;
        } catch (error) {
            throw new Error(`Eroare la actualizarea utilizatorului: ${error.message}`);
        }
    }
}

module.exports = new AuthService();