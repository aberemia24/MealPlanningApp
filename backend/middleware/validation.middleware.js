// middleware/validation.middleware.js
const { validationResult } = require('express-validator');
const { body } = require('express-validator');
const constants = require('../config/constants');

/**
 * Middleware pentru tratarea erorilor de validare
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(constants.STATUS_CODES.BAD_REQUEST).json({ 
            status: 'error',
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * Validări pentru înregistrare utilizator
 */
const validateRegistration = [
    body('username')
        .trim()
        .isLength({ min: constants.VALIDATION.USERNAME_MIN_LENGTH, max: constants.VALIDATION.USERNAME_MAX_LENGTH })
        .withMessage(`Username-ul trebuie să aibă între ${constants.VALIDATION.USERNAME_MIN_LENGTH} și ${constants.VALIDATION.USERNAME_MAX_LENGTH} caractere`)
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username-ul poate conține doar litere, cifre și underscore'),

    body('password')
        .isLength({ min: constants.AUTH.PASSWORD_MIN_LENGTH })
        .withMessage(`Parola trebuie să aibă cel puțin ${constants.AUTH.PASSWORD_MIN_LENGTH} caractere`)
        .matches(/\d/)
        .withMessage('Parola trebuie să conțină cel puțin o cifră')
        .matches(/[A-Z]/)
        .withMessage('Parola trebuie să conțină cel puțin o literă mare'),

    body('preferences.menuType')
        .if(body('role').equals('user'))
        .isIn(Object.values(constants.MENU_TYPES))
        .withMessage(constants.ERROR_MESSAGES.INVALID_MENU_TYPE),

    body('preferences.numberOfPeople')
        .if(body('role').equals('user'))
        .isInt({ min: constants.VALIDATION.MIN_PEOPLE, max: constants.VALIDATION.MAX_PEOPLE })
        .withMessage(`Numărul de persoane trebuie să fie între ${constants.VALIDATION.MIN_PEOPLE} și ${constants.VALIDATION.MAX_PEOPLE}`),

    handleValidationErrors
];

/**
 * Validări pentru rețete
 */
const validateRecipe = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Numele rețetei este obligatoriu')
        .isLength({ max: constants.RECIPE.MAX_NAME_LENGTH })
        .withMessage(`Numele rețetei nu poate depăși ${constants.RECIPE.MAX_NAME_LENGTH} caractere`),
    
    body('ingredients')
        .isArray()
        .withMessage('Ingredientele trebuie să fie un array')
        .notEmpty()
        .withMessage('Trebuie să specificați cel puțin un ingredient'),
    
    body('ingredients.*.name')
        .trim()
        .notEmpty()
        .withMessage('Numele ingredientului este obligatoriu'),
    
    body('ingredients.*.quantity')
        .isFloat({ min: 0 })
        .withMessage('Cantitatea trebuie să fie un număr pozitiv'),
    
    body('ingredients.*.unit')
        .isIn(constants.RECIPE.UNITS_OF_MEASURE)
        .withMessage('Unitate de măsură invalidă'),
    
    body('nutrition')
        .isObject()
        .withMessage('Informațiile nutriționale sunt obligatorii'),
    
    body('nutrition.calories')
        .isFloat({ min: 0 })
        .withMessage('Caloriile trebuie să fie un număr pozitiv'),
    
    body('nutrition.protein')
        .isFloat({ min: 0 })
        .withMessage('Proteinele trebuie să fie un număr pozitiv'),
    
    body('nutrition.carbs')
        .isFloat({ min: 0 })
        .withMessage('Carbohidrații trebuie să fie un număr pozitiv'),
    
    body('nutrition.fat')
        .isFloat({ min: 0 })
        .withMessage('Grăsimile trebuie să fie un număr pozitiv'),
    
    body('steps')
        .isArray()
        .withMessage('Pașii trebuie să fie un array')
        .notEmpty()
        .withMessage('Trebuie să specificați cel puțin un pas'),
    
    body('steps.*')
        .trim()
        .notEmpty()
        .withMessage('Fiecare pas trebuie să conțină instrucțiuni'),
    
    body('isVegetarian')
        .isBoolean()
        .withMessage('Specificați dacă rețeta este vegetariană'),
    
    body('prepTime')
        .isInt({ min: constants.RECIPE.MIN_PREP_TIME })
        .withMessage(`Timpul de preparare trebuie să fie cel puțin ${constants.RECIPE.MIN_PREP_TIME} minut`),
    
    body('difficulty')
        .isIn(constants.RECIPE.DIFFICULTY_LEVELS)
        .withMessage('Dificultatea trebuie să fie: easy, medium sau hard'),
    
    handleValidationErrors
];

/**
 * Validări pentru meniuri
 */
const validateMenu = [
    body('week')
        .matches(constants.VALIDATION.WEEK_FORMAT)
        .withMessage(constants.ERROR_MESSAGES.INVALID_WEEK),
    
    body('days')
        .isObject()
        .withMessage('Zilele trebuie să fie un obiect'),
    
    ...Object.values(constants.DAYS_OF_WEEK).map(day => 
        body(`days.${day}`)
            .isArray()
            .withMessage(`Rețetele pentru ${day} trebuie să fie un array`)
            .notEmpty()
            .withMessage(`Trebuie să specificați cel puțin o rețetă pentru ${day}`)
    ),
    
    body('menuType')
        .isIn(Object.values(constants.MENU_TYPES))
        .withMessage(constants.ERROR_MESSAGES.INVALID_MENU_TYPE),
    
    handleValidationErrors
];

/**
 * Validări pentru actualizare profil utilizator
 */
const validateUserUpdate = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: constants.VALIDATION.USERNAME_MIN_LENGTH, max: constants.VALIDATION.USERNAME_MAX_LENGTH })
        .withMessage(`Username-ul trebuie să aibă între ${constants.VALIDATION.USERNAME_MIN_LENGTH} și ${constants.VALIDATION.USERNAME_MAX_LENGTH} caractere`)
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username-ul poate conține doar litere, cifre și underscore'),

    body('preferences.menuType')
        .optional()
        .isIn(Object.values(constants.MENU_TYPES))
        .withMessage(constants.ERROR_MESSAGES.INVALID_MENU_TYPE),

    body('preferences.numberOfPeople')
        .optional()
        .isInt({ min: constants.VALIDATION.MIN_PEOPLE, max: constants.VALIDATION.MAX_PEOPLE })
        .withMessage(`Numărul de persoane trebuie să fie între ${constants.VALIDATION.MIN_PEOPLE} și ${constants.VALIDATION.MAX_PEOPLE}`),

    handleValidationErrors
];

/**
 * Validări pentru schimbarea parolei
 */
const validatePasswordChange = [
    body('currentPassword')
        .notEmpty()
        .withMessage('Parola curentă este obligatorie'),

    body('newPassword')
        .isLength({ min: constants.AUTH.PASSWORD_MIN_LENGTH })
        .withMessage(`Parola nouă trebuie să aibă cel puțin ${constants.AUTH.PASSWORD_MIN_LENGTH} caractere`)
        .matches(/\d/)
        .withMessage('Parola trebuie să conțină cel puțin o cifră')
        .matches(/[A-Z]/)
        .withMessage('Parola trebuie să conțină cel puțin o literă mare'),

    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateRegistration,
    validateRecipe,
    validateMenu,
    validateUserUpdate,
    validatePasswordChange
};