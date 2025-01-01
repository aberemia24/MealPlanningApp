// controllers/menu.controller.js
const Menu = require('../models/Menu');
const Recipe = require('../models/Recipe');
const { AppError } = require('../utils/appError');
const { catchAsync } = require('../middleware/error.middleware');
const constants = require('../config/constants');

/**
 * @swagger
 * /api/menus:
 *   post:
 *     summary: Creează un meniu săptămânal nou
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Menu'
 *     responses:
 *       201:
 *         description: Meniul a fost creat cu succes
 */
const createMenu = catchAsync(async (req, res) => {
    // Verifică dacă utilizatorul are permisiunea necesară
    if (!['nutritionist', 'chef'].includes(req.user.role)) {
        throw new AppError(constants.ERROR_MESSAGES.UNAUTHORIZED, constants.STATUS_CODES.FORBIDDEN);
    }

    // Verificăm dacă toate rețetele există
    const allRecipeIds = Object.values(req.body.days).flat();
    const recipes = await Recipe.find({ _id: { $in: allRecipeIds } });

    if (recipes.length !== allRecipeIds.length) {
        throw new AppError(constants.ERROR_MESSAGES.RECIPE_NOT_FOUND, constants.STATUS_CODES.BAD_REQUEST);
    }

    // Pentru meniuri vegetariene, verificăm dacă toate rețetele sunt vegetariene
    if (req.body.menuType === constants.MENU_TYPES.VEGETARIAN) {
        const nonVegetarianRecipes = recipes.filter(recipe => !recipe.isVegetarian);
        if (nonVegetarianRecipes.length > 0) {
            throw new AppError(constants.ERROR_MESSAGES.VEGETARIAN_CONFLICT, constants.STATUS_CODES.BAD_REQUEST);
        }
    }

    const menu = new Menu({
        ...req.body,
        createdBy: req.user._id
    });

    await menu.save();

    res.status(constants.STATUS_CODES.CREATED).json({
        status: 'success',
        data: menu
    });
});

/**
 * @swagger
 * /api/menus/{week}:
 *   get:
 *     summary: Obține meniul pentru o săptămână specifică
 *     tags: [Menus]
 *     parameters:
 *       - in: path
 *         name: week
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificatorul săptămânii (format YYYY-WW)
 *     responses:
 *       200:
 *         description: Meniul săptămânal găsit
 */
const getMenuByWeek = catchAsync(async (req, res) => {
    // Validăm formatul săptămânii
    if (!constants.VALIDATION.WEEK_FORMAT.test(req.params.week)) {
        throw new AppError(constants.ERROR_MESSAGES.INVALID_WEEK, constants.STATUS_CODES.BAD_REQUEST);
    }

    const menu = await Menu.findOne({ 
        week: req.params.week,
        menuType: req.user.preferences?.menuType || constants.MENU_TYPES.OMNIVORE
    }).populate({
        path: Object.values(constants.DAYS_OF_WEEK)
            .map(day => `days.${day}`)
            .join(' '),
        select: 'name ingredients nutrition steps isVegetarian prepTime difficulty'
    });

    if (!menu) {
        throw new AppError(constants.ERROR_MESSAGES.NOT_FOUND, constants.STATUS_CODES.NOT_FOUND);
    }

    // Calculăm lista de cumpărături dacă utilizatorul are setat numărul de persoane
    let shoppingList = null;
    if (req.user.preferences?.numberOfPeople) {
        shoppingList = await menu.generateShoppingList(req.user.preferences.numberOfPeople);
    }

    // Calculăm valorile nutriționale
    const dailyNutrition = await menu.dailyNutrition;

    res.status(constants.STATUS_CODES.OK).json({
        status: 'success',
        data: {
            menu,
            dailyNutrition,
            shoppingList,
            forPeople: req.user.preferences?.numberOfPeople
        }
    });
});

/**
 * @swagger
 * /api/menus:
 *   get:
 *     summary: Obține toate meniurile
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de meniuri
 */
const getAllMenus = catchAsync(async (req, res) => {
    const filter = {};
    
    // Pentru utilizatori normali, returnăm doar meniurile care corespund preferințelor lor
    if (req.user.role === 'user' && req.user.preferences?.menuType) {
        filter.menuType = req.user.preferences.menuType;
    }

    // Pentru nutriționiști/bucătari, putem filtra după creator
    if (['nutritionist', 'chef'].includes(req.user.role) && req.query.createdBy) {
        filter.createdBy = req.query.createdBy;
    }

    // Adăugăm filtrare după săptămână dacă există
    if (req.query.week) {
        if (!constants.VALIDATION.WEEK_FORMAT.test(req.query.week)) {
            throw new AppError(constants.ERROR_MESSAGES.INVALID_WEEK, constants.STATUS_CODES.BAD_REQUEST);
        }
        filter.week = req.query.week;
    }

    const menus = await Menu.find(filter)
        .populate('createdBy', 'username role')
        .sort('-week');

    res.status(constants.STATUS_CODES.OK).json({
        status: 'success',
        results: menus.length,
        data: menus
    });
});

/**
 * @swagger
 * /api/menus/{id}:
 *   patch:
 *     summary: Actualizează un meniu săptămânal
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meniul a fost actualizat cu succes
 */
const updateMenu = catchAsync(async (req, res) => {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
        throw new AppError(constants.ERROR_MESSAGES.NOT_FOUND, constants.STATUS_CODES.NOT_FOUND);
    }

    // Verifică dacă utilizatorul are dreptul să modifice meniul
    if (menu.createdBy.toString() !== req.user._id.toString() && 
        !['admin', 'nutritionist'].includes(req.user.role)) {
        throw new AppError(constants.ERROR_MESSAGES.UNAUTHORIZED, constants.STATUS_CODES.FORBIDDEN);
    }

    // Verificăm dacă toate rețetele noi există, dacă sunt furnizate
    if (req.body.days) {
        const allRecipeIds = Object.values(req.body.days).flat();
        const recipes = await Recipe.find({ _id: { $in: allRecipeIds } });

        if (recipes.length !== allRecipeIds.length) {
            throw new AppError(constants.ERROR_MESSAGES.RECIPE_NOT_FOUND, constants.STATUS_CODES.BAD_REQUEST);
        }

        // Verificăm compatibilitatea cu tipul de meniu
        if (req.body.menuType === constants.MENU_TYPES.VEGETARIAN || 
            (menu.menuType === constants.MENU_TYPES.VEGETARIAN && !req.body.menuType)) {
            const nonVegetarianRecipes = recipes.filter(recipe => !recipe.isVegetarian);
            if (nonVegetarianRecipes.length > 0) {
                throw new AppError(constants.ERROR_MESSAGES.VEGETARIAN_CONFLICT, constants.STATUS_CODES.BAD_REQUEST);
            }
        }
    }

    Object.assign(menu, req.body);
    await menu.save();

    res.status(constants.STATUS_CODES.OK).json({
        status: 'success',
        data: menu
    });
});

/**
 * @swagger
 * /api/menus/{id}:
 *   delete:
 *     summary: Șterge un meniu săptămânal
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Meniul a fost șters cu succes
 */
const deleteMenu = catchAsync(async (req, res) => {
    const menu = await Menu.findById(req.params.id);

    if (!menu) {
        throw new AppError(constants.ERROR_MESSAGES.NOT_FOUND, constants.STATUS_CODES.NOT_FOUND);
    }

    // Verifică permisiunile
    if (menu.createdBy.toString() !== req.user._id.toString() && 
        !['admin', 'nutritionist'].includes(req.user.role)) {
        throw new AppError(constants.ERROR_MESSAGES.UNAUTHORIZED, constants.STATUS_CODES.FORBIDDEN);
    }

    // Soft delete
    menu.active = false;
    await menu.save();

    res.status(constants.STATUS_CODES.NO_CONTENT).json({
        status: 'success',
        data: null
    });
});

/**
 * @swagger
 * /api/menus/{id}/shopping-list:
 *   get:
 *     summary: Generează lista de cumpărături pentru un meniu
 *     tags: [Menus]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de cumpărături generată cu succes
 */
const getShoppingList = catchAsync(async (req, res) => {
    const menu = await Menu.findById(req.params.id);
    
    if (!menu) {
        throw new AppError(constants.ERROR_MESSAGES.NOT_FOUND, constants.STATUS_CODES.NOT_FOUND);
    }

    const numberOfPeople = req.user.preferences?.numberOfPeople || 1;
    const shoppingList = await menu.generateShoppingList(numberOfPeople);

    res.status(constants.STATUS_CODES.OK).json({
        status: 'success',
        data: {
            shoppingList,
            forPeople: numberOfPeople
        }
    });
});

module.exports = {
    createMenu,
    getMenuByWeek,
    getAllMenus,
    updateMenu,
    deleteMenu,
    getShoppingList
};