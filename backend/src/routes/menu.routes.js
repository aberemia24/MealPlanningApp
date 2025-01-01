const express = require('express');
const { createMenu, getMenuByWeek } = require('../controllers/menu.controller');
const router = express.Router();

router.post('/', createMenu);
router.get('/:week', getMenuByWeek);

module.exports = router;
