// backend/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const AuthService = require('../services/auth.service');
const { catchAsync } = require('../middleware/error.middleware');
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware pentru tratarea erorilor de validare
 * Verifică dacă există erori de validare și returnează un răspuns corespunzător
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

/**
 * Rută pentru înregistrarea utilizatorilor noi
 * POST /api/auth/register
 * @param {string} username - Numele de utilizator
 * @param {string} password - Parola utilizatorului
 * @returns {Object} Utilizatorul creat și mesaj de succes
 */
router.post('/register', [
    check("username", "Username este obligatoriu").notEmpty(),
    check("password", "Parola trebuie să aibă cel puțin 6 caractere").isLength({ min: 6 }),
], handleValidationErrors, catchAsync(async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("Încercare de înregistrare pentru username:", username);

        // Verifică dacă utilizatorul există deja
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Acest username există deja!" });
        }

        const user = new User({
            username,
            password // Parola va fi hașurată automat prin middleware-ul din modelul User
        });

        await user.save();
        console.log("Utilizator creat cu succes:", username);

        res.status(201).json({
            message: "Utilizator creat cu succes!",
            user: {
                id: user._id,
                username: user.username
            }
        });
    } catch (error) {
        console.error("Eroare la înregistrare:", error);
        res.status(500).json({ message: "Eroare la înregistrare!" });
    }
}));

/**
 * Rută pentru autentificarea utilizatorilor
 * POST /api/auth/login
 * @param {string} username - Numele de utilizator
 * @param {string} password - Parola utilizatorului
 * @returns {Object} Token JWT și datele utilizatorului
 */
router.post('/login', [
    check("username", "Username este obligatoriu").notEmpty(),
    check("password", "Parola este obligatorie").notEmpty(),
], handleValidationErrors, catchAsync(async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log("Încercare de autentificare pentru username:", username);

        // Caută utilizatorul
        const user = await User.findOne({ username });
        if (!user) {
            console.log("Utilizator inexistent:", username);
            return res.status(401).json({ message: "Credențiale invalide!" });
        }

        // Verifică parola
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            console.log("Parolă incorectă pentru utilizatorul:", username);
            return res.status(401).json({ message: "Credențiale invalide!" });
        }

        // Generează token JWT
        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        console.log("Autentificare reușită pentru:", username);

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username
            }
        });
    } catch (error) {
        console.error("Eroare la autentificare:", error);
        res.status(500).json({ message: "Eroare la autentificare!" });
    }
}));

module.exports = router;