const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    week: { type: String, required: true },
    days: {
        monday: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
        tuesday: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
        wednesday: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
        thursday: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
        friday: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
        saturday: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
        sunday: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' }],
    },
}, { timestamps: true });

module.exports = mongoose.model('Menu', menuSchema);
