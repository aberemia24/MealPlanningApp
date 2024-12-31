const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Importă CORS
require('dotenv').config();

const app = express();
app.use(express.json());

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const recipeRoutes = require('./src/routes/recipes.routes');

app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);

// Middleware
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use(cors()); // Activează CORS pentru toate cererile
app.use(express.json());
// Error handling
const { handleErrors } = require('./src/middleware/error.middleware');
app.use(handleErrors);

// Database connection
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to database'))
  .catch((error) => console.error('Database connection error:', error));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
