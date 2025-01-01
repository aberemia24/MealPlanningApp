const express = require('express');
const { createRecipe, getAllRecipes } = require('../controllers/recipeController');
const router = express.Router();

router.post('/', createRecipe);
router.get('/', getAllRecipes);

module.exports = router;
