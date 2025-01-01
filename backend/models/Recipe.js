// models/Recipe.js
const mongoose = require('mongoose');
const constants = require('../config/constants');

/**
 * @swagger
 * components:
 *   schemas:
 *     Recipe:
 *       type: object
 *       required:
 *         - name
 *         - ingredients
 *         - steps
 *         - nutrition
 *       properties:
 *         name:
 *           type: string
 *           description: Numele rețetei
 *         ingredients:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Numele ingredientului
 *               quantity:
 *                 type: number
 *                 description: Cantitatea necesară (per persoană)
 *               unit:
 *                 type: string
 *                 description: Unitatea de măsură
 *         nutrition:
 *           type: object
 *           properties:
 *             calories:
 *               type: number
 *               description: Calorii per porție
 *             protein:
 *               type: number
 *               description: Proteine în grame per porție
 *             carbs:
 *               type: number
 *               description: Carbohidrați în grame per porție
 *             fat:
 *               type: number
 *               description: Grăsimi în grame per porție
 *         steps:
 *           type: array
 *           items:
 *             type: string
 *           description: Pașii de preparare
 *         isVegetarian:
 *           type: boolean
 *           description: Indică dacă rețeta este vegetariană
 *         prepTime:
 *           type: number
 *           description: Timp de preparare în minute
 *         difficulty:
 *           type: string
 *           enum: [easy, medium, hard]
 *           description: Nivel de dificultate
 *         createdBy:
 *           type: string
 *           description: ID-ul utilizatorului care a creat rețeta
 */

const recipeSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, constants.ERROR_MESSAGES.VALIDATION_ERROR],
        trim: true,
        maxlength: [constants.RECIPE.MAX_NAME_LENGTH, 
            `Numele rețetei nu poate depăși ${constants.RECIPE.MAX_NAME_LENGTH} caractere`]
    },
    ingredients: [{
        name: { 
            type: String, 
            required: [true, 'Fiecare ingredient trebuie să aibă un nume'],
            trim: true
        },
        quantity: { 
            type: Number, 
            required: [true, 'Specificați cantitatea ingredientului'],
            min: [0, 'Cantitatea nu poate fi negativă']
        },
        unit: { 
            type: String, 
            required: [true, 'Specificați unitatea de măsură'],
            enum: {
                values: constants.RECIPE.UNITS_OF_MEASURE,
                message: 'Unitate de măsură invalidă'
            }
        }
    }],
    nutrition: {
        calories: { 
            type: Number, 
            required: [true, 'Specificați numărul de calorii'],
            min: [0, 'Caloriile nu pot fi negative']
        },
        protein: { 
            type: Number, 
            required: [true, 'Specificați cantitatea de proteine'],
            min: [0, 'Proteinele nu pot fi negative']
        },
        carbs: { 
            type: Number, 
            required: [true, 'Specificați cantitatea de carbohidrați'],
            min: [0, 'Carbohidrații nu pot fi negativi']
        },
        fat: { 
            type: Number, 
            required: [true, 'Specificați cantitatea de grăsimi'],
            min: [0, 'Grăsimile nu pot fi negative']
        }
    },
    steps: [{
        type: String,
        required: [true, 'O rețetă trebuie să aibă pași de preparare'],
        trim: true
    }],
    isVegetarian: {
        type: Boolean,
        default: false
    },
    prepTime: {
        type: Number,
        required: [true, 'Specificați timpul de preparare'],
        min: [constants.RECIPE.MIN_PREP_TIME, 
            `Timpul de preparare trebuie să fie cel puțin ${constants.RECIPE.MIN_PREP_TIME} minut`]
    },
    difficulty: {
        type: String,
        enum: {
            values: constants.RECIPE.DIFFICULTY_LEVELS,
            message: 'Dificultatea trebuie să fie: easy, medium sau hard'
        },
        required: [true, 'Specificați nivelul de dificultate']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'O rețetă trebuie să aibă un autor']
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexuri pentru performanță
recipeSchema.index({ name: 1 });
recipeSchema.index({ isVegetarian: 1 });
recipeSchema.index({ difficulty: 1 });
recipeSchema.index({ createdBy: 1 });

// Virtual pentru calculul porției per persoană
recipeSchema.virtual('portionSize').get(function() {
    return {
        calories: this.nutrition.calories,
        protein: this.nutrition.protein,
        carbs: this.nutrition.carbs,
        fat: this.nutrition.fat
    };
});

// Metodă pentru calculul cantităților pentru un număr specific de persoane
recipeSchema.methods.calculateForPeople = function(numberOfPeople) {
    if (numberOfPeople < constants.VALIDATION.MIN_PEOPLE || 
        numberOfPeople > constants.VALIDATION.MAX_PEOPLE) {
        throw new Error(`Numărul de persoane trebuie să fie între ${constants.VALIDATION.MIN_PEOPLE} și ${constants.VALIDATION.MAX_PEOPLE}`);
    }

    return {
        ingredients: this.ingredients.map(ing => ({
            ...ing.toObject(),
            quantity: ing.quantity * numberOfPeople
        })),
        nutrition: {
            calories: this.nutrition.calories * numberOfPeople,
            protein: this.nutrition.protein * numberOfPeople,
            carbs: this.nutrition.carbs * numberOfPeople,
            fat: this.nutrition.fat * numberOfPeople
        }
    };
};

// Middleware pre-save pentru validări adiționale
recipeSchema.pre('save', function(next) {
    // Verifică dacă există cel puțin un ingredient
    if (this.ingredients.length === 0) {
        next(new Error(constants.ERROR_MESSAGES.VALIDATION_ERROR));
    }
    
    // Verifică dacă există cel puțin un pas
    if (this.steps.length === 0) {
        next(new Error(constants.ERROR_MESSAGES.VALIDATION_ERROR));
    }

    next();
});

// Query middleware pentru a exclude rețetele inactive
recipeSchema.pre(/^find/, function(next) {
    this.find({ active: { $ne: false } });
    next();
});

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;