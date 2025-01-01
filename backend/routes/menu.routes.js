// routes/menu.routes.js
const express = require('express');
const {
    createMenu,
    getMenuByWeek,
    getAllMenus,
    updateMenu,
    deleteMenu,
    getShoppingList
} = require('../controllers/menu.controller');
const { protectRoute, requireNutritionistOrChef } = require('../middleware/auth.middleware');
const { validateMenu } = require('../middleware/validation.middleware');

const router = express.Router();

// Toate rutele necesită autentificare
router.use(protectRoute);

// Rute pentru toți utilizatorii autentificați
router.get('/', getAllMenus);
router.get('/:week', getMenuByWeek);
router.get('/:id/shopping-list', getShoppingList);

// Rute doar pentru nutriționiști și bucătari
router.use(requireNutritionistOrChef);
router.post('/', validateMenu, createMenu);
router.patch('/:id', validateMenu, updateMenu);
router.delete('/:id', deleteMenu);

module.exports = router;