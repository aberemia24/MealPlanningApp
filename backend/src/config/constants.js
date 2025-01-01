// backend/config/constants.js

/**
 * Constante utilizate în întreaga aplicație
 */
const constants = {
    /**
     * Tipuri de tranzacții suportate
     */
    TRANSACTION_TYPES: {
        INCOME: 'income',
        EXPENSE: 'expense'
    },

    /**
     * Coduri de stare HTTP
     */
    STATUS_CODES: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        NOT_FOUND: 404,
        INTERNAL_SERVER: 500
    },

    /**
     * Tipuri de planuri de subscripție
     */
    SUBSCRIPTION_PLANS: {
        FREE: 'free',
        PREMIUM: 'premium'
    },

    /**
     * Limite pentru diferite funcționalități
     */
    LIMITS: {
        FREE_TRANSACTIONS_PER_MONTH: 50,
        FREE_CASH_FLOW_DAYS: 7,
        PREMIUM_CASH_FLOW_DAYS: 30
    }
};

module.exports = constants;