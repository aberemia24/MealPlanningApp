// controllers/recipe.controller.js
const Recipe = require('../models/Recipe');
const { AppError } = require('../utils/appError');
const { catchAsync } = require('../middleware/error.middleware');
const constants = require('../config/constants');

/**
 * @swagger
 * /api/recipes:
 *   post:
 *     summary: Creează o rețetă nouă
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Recipe'
 *     responses:
 *       201:
 *         description: Rețeta a fost creată cu succes
 *       400:
 *         description: Date invalide
 *       401:
 *         description: Neautorizat
 */
const createRecipe = catchAsync(async (req, res) => {
    if (!req.user.role.includes('nutritionist') && !req.user.role.includes('chef')) {
        throw new AppError('Nu aveți permisiunea de a crea rețete', constants.STATUS_CODES.FORBIDDEN);
    }

    const recipe = new Recipe({
        ...req.body,
        createdBy: req.user._id
    });

    await recipe.save();
    
    res.status(constants.STATUS_CODES.CREATED).json({
        status: 'success',
        data: recipe
    });
});

/**
 * @swagger
 * /api/recipes:
 *   get:
 *     summary: Obține toate rețetele
 *     tags: [Recipes]
 *     parameters:
 *       - in: query
 *         name: isVegetarian
 *         schema:
 *           type: boolean
 *         description: Filtrează rețetele vegetariene
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [easy, medium, hard]
 *         description: Filtrează după dificultate
 *     responses:
 *       200:
 *         description: Lista de rețete
 */
const getAllRecipes = catchAsync(async (req, res) => {
    const filter = {};
    
    // Filtrare după tip vegetarian
    if (req.query.isVegetarian) {
        filter.isVegetarian = req.query.isVegetarian === 'true';
    }
    
    // Filtrare după dificultate
    if (req.query.difficulty) {
        if (!constants.RECIPE.DIFFICULTY_LEVELS.includes(req.query.difficulty)) {
            throw new AppError('Nivel de dificultate invalid', constants.STATUS_CODES.BAD_REQUEST);
        }
        filter.difficulty = req.query.difficulty;
    }

    // Filtrare după creator (doar pentru nutriționiști/bucătari)
    if (req.query.createdBy && (req.user.role === 'nutritionist' || req.user.role === 'chef')) {
        filter.createdBy = req.query.createdBy;
    }

    const recipes = await Recipe.find(filter)
        .populate('createdBy', 'username role')
        .sort('-createdAt');

    res.status(constants.STATUS_CODES.OK).json({
        status: 'success',
        results: recipes.length,
        data: recipes
    });
});

/**
 * @swagger
 * /api/recipes/{id}:
 *   get:
 *     summary: Obține o rețetă după ID
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rețeta găsită
 *       404:
 *         description: Rețeta nu a fost găsită
 */
const getRecipeById = catchAsync(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id)
        .populate('createdBy', 'username role');

    if (!recipe) {
        throw new AppError(constants.ERROR_MESSAGES.NOT_FOUND, constants.STATUS_CODES.NOT_FOUND);
    }

    res.status(constants.STATUS_CODES.OK).json({
        status: 'success',
        data: recipe
    });
});

/**
 * @swagger
 * /api/recipes/{id}:
 *   patch:
 *     summary: Actualizează o rețetă
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Recipe'
 *     responses:
 *       200:
 *         description: Rețeta a fost actualizată
 *       404:
 *         description: Rețeta nu a fost găsită
 */
const updateRecipe = catchAsync(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
        throw new AppError(constants.ERROR_MESSAGES.NOT_FOUND, constants.STATUS_CODES.NOT_FOUND);
    }

    // Verifică permisiunile
    if (recipe.createdBy.toString() !== req.user._id.toString() && 
        !['admin', 'nutritionist'].includes(req.user.role)) {
        throw new AppError(constants.ERROR_MESSAGES.UNAUTHORIZED, constants.STATUS_CODES.FORBIDDEN);
    }

    // Validare specifică pentru ingrediente
    if (req.body.ingredients && req.body.ingredients.length < 1) {
        throw new AppError('O rețetă trebuie să aibă cel puțin un ingredient', constants.STATUS_CODES.BAD_REQUEST);
    }

    // Validare specifică pentru pași
    if (req.body.steps && req.body.steps.length < 1) {
        throw new AppError('O rețetă trebuie să aibă cel puțin un pas', constants.STATUS_CODES.BAD_REQUEST);
    }

    Object.assign(recipe, req.body);
    await recipe.save();

    res.status(constants.STATUS_CODES.OK).json({
        status: 'success',
        data: recipe
    });
});

/**
 * @swagger
 * /api/recipes/{id}:
 *   delete:
 *     summary: Șterge o rețetă
 *     tags: [Recipes]
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
 *         description: Rețeta a fost ștearsă
 *       404:
 *         description: Rețeta nu a fost găsită
 */
const deleteRecipe = catchAsync(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
        throw new AppError(constants.ERROR_MESSAGES.NOT_FOUND, constants.STATUS_CODES.NOT_FOUND);
    }

    // Verifică permisiunile
    if (recipe.createdBy.toString() !== req.user._id.toString() && 
        !['admin', 'nutritionist'].includes(req.user.role)) {
        throw new AppError(constants.ERROR_MESSAGES.UNAUTHORIZED, constants.STATUS_CODES.FORBIDDEN);
    }

    // Soft delete
    recipe.active = false;
    await recipe.save();

    res.status(constants.STATUS_CODES.NO_CONTENT).json({
        status: 'success',
        data: null
    });
});

/**
 * @swagger
 * /api/recipes/search:
 *   get:
 *     summary: Caută rețete
 *     tags: [Recipes]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Termen de căutare
 *     responses:
 *       200:
 *         description: Rezultatele căutării
 */
const searchRecipes = catchAsync(async (req, res) => {
    const { q } = req.query;
    
    if (!q) {
        throw new AppError('Specificați un termen de căutare', constants.STATUS_CODES.BAD_REQUEST);
    }

    const recipes = await Recipe.find({
        $or: [
            { name: { $regex: q, $options: 'i' } },
            { 'ingredients.name': { $regex: q, $options: 'i' } }
        ]
    }).populate('createdBy', 'username role');

    res.status(constants.STATUS_CODES.OK).json({
        status: 'success',
        results: recipes.length,
        data: recipes
    });
});

/**
 * @swagger
 * /api/recipes/{id}/shopping-list/{people}:
 *   get:
 *     summary: Generează lista de cumpărături pentru o rețetă și un număr de persoane
 *     tags: [Recipes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: people
 *         required: true
 *         schema:
 *           type: integer
 *         minimum: 1
 *     responses:
 *       200:
 *         description: Lista de cumpărături generată
 */
const getShoppingList = catchAsync(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
        throw new AppError(constants.ERROR_MESSAGES.NOT_FOUND, constants.STATUS_CODES.NOT_FOUND);
    }

    const numberOfPeople = parseInt(req.params.people);
    if (numberOfPeople < constants.VALIDATION.MIN_PEOPLE || 
        numberOfPeople > constants.VALIDATION.MAX_PEOPLE) {
        throw new AppError(
            `Numărul de persoane trebuie să fie între ${constants.VALIDATION.MIN_PEOPLE} și ${constants.VALIDATION.MAX_PEOPLE}`,
            constants.STATUS_CODES.BAD_REQUEST
        );
    }

    const shoppingList = recipe.calculateForPeople(numberOfPeople);

    res.status(constants.STATUS_CODES.OK).json({
        status: 'success',
        data: {
            shoppingList,
            forPeople: numberOfPeople
        }
    });
});

module.exports = {
    createRecipe,
    getAllRecipes,
    getRecipeById,
    updateRecipe,
    deleteRecipe,
    searchRecipes,
    getShoppingList
};