// models/Menu.js
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Menu:
 *       type: object
 *       required:
 *         - week
 *         - days
 *         - menuType
 *         - createdBy
 *       properties:
 *         week:
 *           type: string
 *           description: Identificatorul săptămânii (format YYYY-WW)
 *         days:
 *           type: object
 *           properties:
 *             monday:
 *               type: array
 *               items:
 *                 type: string
 *                 description: ID-uri de rețete
 *             tuesday:
 *               type: array
 *               items:
 *                 type: string
 *             wednesday:
 *               type: array
 *               items:
 *                 type: string
 *             thursday:
 *               type: array
 *               items:
 *                 type: string
 *             friday:
 *               type: array
 *               items:
 *                 type: string
 *             saturday:
 *               type: array
 *               items:
 *                 type: string
 *             sunday:
 *               type: array
 *               items:
 *                 type: string
 *         menuType:
 *           type: string
 *           enum: [vegetarian, omnivor]
 *           description: Tipul de meniu
 *         createdBy:
 *           type: string
 *           description: ID-ul nutriționistului care a creat meniul
 */

const menuSchema = new mongoose.Schema({
    week: {
        type: String,
        required: [true, 'Specificați săptămâna meniului'],
        validate: {
            validator: function(v) {
                return /^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/.test(v);
            },
            message: props => `${props.value} nu este un format valid de săptămână! Folosiți formatul YYYY-WDD (ex: 2024-W01)`
        }
    },
    days: {
        monday: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe',
            required: true
        }],
        tuesday: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe',
            required: true
        }],
        wednesday: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe',
            required: true
        }],
        thursday: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe',
            required: true
        }],
        friday: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe',
            required: true
        }],
        saturday: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe',
            required: true
        }],
        sunday: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe',
            required: true
        }]
    },
    menuType: {
        type: String,
        enum: {
            values: ['vegetarian', 'omnivor'],
            message: 'Tipul de meniu trebuie să fie vegetarian sau omnivor'
        },
        required: [true, 'Specificați tipul de meniu']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Un meniu trebuie să aibă un autor']
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
menuSchema.index({ week: 1, menuType: 1 }, { unique: true });
menuSchema.index({ createdBy: 1 });

// Virtual pentru calculul valorilor nutriționale totale pe zi
menuSchema.virtual('dailyNutrition').get(async function() {
    const dailyNutrition = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
        const recipes = await mongoose.model('Recipe').find({
            _id: { $in: this.days[day] }
        });
        
        dailyNutrition[day] = recipes.reduce((acc, recipe) => ({
            calories: acc.calories + recipe.nutrition.calories,
            protein: acc.protein + recipe.nutrition.protein,
            carbs: acc.carbs + recipe.nutrition.carbs,
            fat: acc.fat + recipe.nutrition.fat
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    }
    
    return dailyNutrition;
});

// Metodă pentru calculul listei de cumpărături pentru un număr specific de persoane
menuSchema.methods.generateShoppingList = async function(numberOfPeople) {
    const allRecipes = await Promise.all(
        Object.values(this.days).flat().map(recipeId => 
            mongoose.model('Recipe').findById(recipeId)
        )
    );

    const ingredients = {};
    
    allRecipes.forEach(recipe => {
        recipe.ingredients.forEach(ing => {
            const key = `${ing.name}_${ing.unit}`;
            if (!ingredients[key]) {
                ingredients[key] = {
                    name: ing.name,
                    quantity: 0,
                    unit: ing.unit
                };
            }
            ingredients[key].quantity += ing.quantity * numberOfPeople;
        });
    });

    return Object.values(ingredients);
};

// Middleware pre-save pentru validări
menuSchema.pre('save', async function(next) {
    // Verifică dacă toate zilele au cel puțin o rețetă
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of days) {
        if (!this.days[day] || this.days[day].length === 0) {
            return next(new Error(`Fiecare zi trebuie să aibă cel puțin o rețetă! Lipsesc rețete pentru ${day}`));
        }
    }

    // Verifică dacă toate rețetele există și sunt compatibile cu tipul de meniu
    if (this.menuType === 'vegetarian') {
        const allRecipes = await mongoose.model('Recipe').find({
            _id: { $in: Object.values(this.days).flat() }
        });

        const nonVegetarianRecipes = allRecipes.filter(recipe => !recipe.isVegetarian);
        if (nonVegetarianRecipes.length > 0) {
            return next(new Error('Un meniu vegetarian nu poate conține rețete non-vegetariene!'));
        }
    }

    next();
});

// Query middleware pentru a exclude meniurile inactive
menuSchema.pre(/^find/, function(next) {
    this.find({ active: { $ne: false } });
    next();
});

const Menu = mongoose.model('Menu', menuSchema);

module.exports = Menu;