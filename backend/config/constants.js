// config/constants.js

/**
 * Constante utilizate în întreaga aplicație
 */
const constants = {
    /**
     * Coduri de stare HTTP
     */
    STATUS_CODES: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        INTERNAL_SERVER: 500
    },

    /**
     * Configurări pentru autentificare și securitate
     */
    AUTH: {
        JWT_EXPIRES_IN: '24h',
        JWT_COOKIE_EXPIRES_IN: 24,
        PASSWORD_MIN_LENGTH: 6,
        ROLES: {
            USER: 'user',
            NUTRITIONIST: 'nutritionist',
            CHEF: 'chef',
            ADMIN: 'admin'
        }
    },

    /**
     * Configurări pentru rețete și meniuri
     */
    RECIPE: {
        UNITS_OF_MEASURE: ['g', 'kg', 'ml', 'l', 'buc', 'lingură', 'linguriță', 'cană', 'praf'],
        DIFFICULTY_LEVELS: ['easy', 'medium', 'hard'],
        MIN_PREP_TIME: 1,
        MAX_NAME_LENGTH: 100
    },

    /**
     * Tipuri de meniu disponibile
     */
    MENU_TYPES: {
        VEGETARIAN: 'vegetarian',
        OMNIVORE: 'omnivor'
    },

    /**
     * Zile ale săptămânii pentru meniuri
     */
    DAYS_OF_WEEK: {
        MONDAY: 'monday',
        TUESDAY: 'tuesday',
        WEDNESDAY: 'wednesday',
        THURSDAY: 'thursday',
        FRIDAY: 'friday',
        SATURDAY: 'saturday',
        SUNDAY: 'sunday'
    },

    /**
     * Validări și formate
     */
    VALIDATION: {
        WEEK_FORMAT: /^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/,
        USERNAME_MIN_LENGTH: 3,
        USERNAME_MAX_LENGTH: 30,
        MIN_PEOPLE: 1,
        MAX_PEOPLE: 20
    },

    /**
     * Mesaje de eroare comune
     */
    ERROR_MESSAGES: {
        UNAUTHORIZED: 'Nu sunteți autorizat să accesați această resursă',
        INVALID_CREDENTIALS: 'Credențiale invalide',
        SERVER_ERROR: 'A apărut o eroare internă',
        VALIDATION_ERROR: 'Date invalide',
        NOT_FOUND: 'Resursa nu a fost găsită',
        DUPLICATE_ENTRY: 'Această înregistrare există deja',
        INVALID_MENU_TYPE: 'Tip de meniu invalid. Trebuie să fie vegetarian sau omnivor',
        VEGETARIAN_CONFLICT: 'Un meniu vegetarian nu poate conține rețete non-vegetariene',
        RECIPE_NOT_FOUND: 'Una sau mai multe rețete nu au fost găsite',
        INVALID_WEEK: 'Format invalid pentru săptămână. Folosiți formatul YYYY-WDD (ex: 2024-W01)'
    }
};

module.exports = constants;