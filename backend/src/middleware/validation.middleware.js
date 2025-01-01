const { validationResult } = require('express-validator');

/**
 * Middleware pentru tratarea erorilor de validare
 * @param {Object} req - Obiectul cererii
 * @param {Object} res - Obiectul răspunsului
 * @param {Function} next - Următoarea funcție middleware
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            succes: false,
            erori: errors.array().map(err => ({
                camp: err.param,
                mesaj: err.msg
            }))
        });
    }
    next();
};

/**
 * Validare pentru câmpuri obligatorii
 * @param {Array} campuri - Lista de câmpuri ce trebuie validate
 */
const validateRequiredFields = (campuri) => {
    return (req, res, next) => {
        const lipsa = campuri.filter(camp => !req.body[camp]);
        if (lipsa.length > 0) {
            return res.status(400).json({
                succes: false,
                erori: lipsa.map(camp => ({
                    camp: camp,
                    mesaj: `Câmpul ${camp} este obligatoriu`
                }))
            });
        }
        next();
    };
};

/**
 * Validare pentru lungimea minimă a textului
 * @param {string} camp - Numele câmpului
 * @param {number} lungimeMinima - Lungimea minimă necesară
 */
const validateMinLength = (camp, lungimeMinima) => {
    return (req, res, next) => {
        if (req.body[camp] && req.body[camp].length < lungimeMinima) {
            return res.status(400).json({
                succes: false,
                erori: [{
                    camp: camp,
                    mesaj: `${camp} trebuie să aibă minim ${lungimeMinima} caractere`
                }]
            });
        }
        next();
    };
};

module.exports = {
    handleValidationErrors,
    validateRequiredFields,
    validateMinLength
};