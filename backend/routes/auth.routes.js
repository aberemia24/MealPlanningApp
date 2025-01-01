// backend/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { handleValidationErrors, validateRegistration } = require('../middleware/validation.middleware');
const { catchAsync } = require('../middleware/error.middleware');
const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API for user authentication and registration
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 example: securePassword123
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 */
router.post('/register', validateRegistration, catchAsync(async (req, res) => {
    try {
        const { username, password, role = "user", preferences } = req.body;
        console.log("Date primite pentru înregistrare:", { username, role, preferences });

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Acest username există deja!" });
        }

        if (role === "user" && (!preferences || !preferences.menuType || !preferences.numberOfPeople)) {
            return res.status(400).json({ 
                message: "Pentru utilizatori normali sunt necesare preferințele (tip meniu și număr persoane)" 
            });
        }

        const user = new User({
            username,
            password,
            role,
            preferences: role === "user" ? preferences : undefined
        });

        await user.save();
        console.log("Utilizator creat cu succes:", user.username);

        res.status(201).json({
            message: "Utilizator creat cu succes!",
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                preferences: user.preferences
            }
        });
    } catch (error) {
        console.error("Eroare la înregistrare:", error);
        res.status(500).json({ message: "Eroare la înregistrare: " + error.message });
    }
}));
/**
* @swagger
* /auth/login:
*   post:
*     summary: Log in a user
*     tags: [Auth]
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             type: object
*             properties:
*               username:
*                 type: string
*                 example: johndoe
*               password:
*                 type: string
*                 example: securePassword123
*     responses:
*       200:
*         description: User logged in successfully
*       401:
*         description: Invalid credentials
*/
console.log('Se încarcă ruta de autentificare');
router.post('/login', catchAsync(async (req, res) => {
   try {
       const { username, password } = req.body;
       console.log("Încercare de autentificare pentru username:", username);

       const user = await User.findOne({ username });
       if (!user) {
           console.log("Utilizator inexistent:", username);
           return res.status(401).json({ message: "Credențiale invalide!" });
       }

       const isMatch = await user.matchPassword(password);
       if (!isMatch) {
           console.log("Parolă incorectă pentru utilizatorul:", username);
           return res.status(401).json({ message: "Credențiale invalide!" });
       }

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
               username: user.username,
               role: user.role,
               preferences: user.preferences
           }
       });
   } catch (error) {
       console.error("Eroare la autentificare:", error);
       res.status(500).json({ message: "Eroare la autentificare!" });
   }
}));
console.log('Rute definite în auth.routes.js');
module.exports = router;