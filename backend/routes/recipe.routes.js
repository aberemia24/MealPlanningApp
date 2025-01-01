// routes/recipe.routes.js
const express = require('express');
const { 
    createRecipe, 
    getAllRecipes, 
    getRecipeById, 
    updateRecipe, 
    deleteRecipe,
    searchRecipes,
    getShoppingList
} = require('../controllers/recipe.controller');
const { protectRoute } = require('../middleware/auth.middleware');
const { requireNutritionistOrChef } = require('../middleware/auth.middleware');
const { validateRecipe } = require('../middleware/validation.middleware');

const router = express.Router();

// Rute publice
router.get('/search', searchRecipes);

// Rute protejate
router.use(protectRoute);

// Rute pentru toți utilizatorii autentificați
router.get('/', getAllRecipes);
router.get('/:id', getRecipeById);
router.get('/:id/shopping-list/:people', getShoppingList);

// Rute doar pentru nutriționiști și bucătari
router.post('/', requireNutritionistOrChef, validateRecipe, createRecipe);
router.patch('/:id', requireNutritionistOrChef, validateRecipe, updateRecipe);
router.delete('/:id', requireNutritionistOrChef, deleteRecipe);

module.exports = router;