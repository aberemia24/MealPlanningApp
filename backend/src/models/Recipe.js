const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ingredients: [{ name: String, quantity: Number, unit: String }],
  steps: [String],
  nutrition: { calories: Number, protein: Number, carbs: Number, fat: Number },
});

module.exports = mongoose.model('Recipe', recipeSchema);
