const express = require('express');
const router = express.Router();
const recipesController = require('../controllers/recipes.controller');

router.post('/', recipesController.createRecipe);
router.get('/', recipesController.getRecipes);

module.exports = router;
