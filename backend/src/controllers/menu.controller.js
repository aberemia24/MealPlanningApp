const Menu = require('../models/Menu');

const createMenu = async (req, res) => {
    try {
        const menu = new Menu(req.body);
        await menu.save();
        res.status(201).json({ message: 'Menu created successfully', menu });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getMenuByWeek = async (req, res) => {
    try {
        const menu = await Menu.findOne({ week: req.params.week }).populate({
            path: 'days.monday days.tuesday days.wednesday days.thursday days.friday days.saturday days.sunday',
        });
        if (!menu) {
            return res.status(404).json({ message: 'Menu not found for the specified week' });
        }
        res.status(200).json(menu);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllMenus = async (req, res) => {
    try {
        const menus = await Menu.find().populate({
            path: 'days.monday days.tuesday days.wednesday days.thursday days.friday days.saturday days.sunday',
        });
        res.status(200).json(menus);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getMenuById = async (req, res) => {
    try {
        const menu = await Menu.findById(req.params.id).populate({
            path: 'days.monday days.tuesday days.wednesday days.thursday days.friday days.saturday days.sunday',
        });
        if (!menu) {
            return res.status(404).json({ message: 'Menu not found' });
        }
        res.status(200).json(menu);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateMenu = async (req, res) => {
    try {
        const menu = await Menu.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate({
            path: 'days.monday days.tuesday days.wednesday days.thursday days.friday days.saturday days.sunday',
        });
        if (!menu) {
            return res.status(404).json({ message: 'Menu not found' });
        }
        res.status(200).json({ message: 'Menu updated successfully', menu });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const deleteMenu = async (req, res) => {
    try {
        const menu = await Menu.findByIdAndDelete(req.params.id);
        if (!menu) {
            return res.status(404).json({ message: 'Menu not found' });
        }
        res.status(200).json({ message: 'Menu deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { 
    createMenu, 
    getMenuByWeek, 
    getAllMenus, 
    getMenuById, 
    updateMenu, 
    deleteMenu 
};