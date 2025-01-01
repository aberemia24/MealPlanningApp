// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');

// Configurări
dotenv.config();
const swaggerSpec = require('./config/swagger');
const constants = require('./config/constants');

// Import routes
const authRoutes = require('./routes/auth.routes');
const recipeRoutes = require('./routes/recipe.routes');
const menuRoutes = require('./routes/menu.routes');
console.log('Rute disponibile:', [
    ...Object.keys(authRoutes.stack || {}).map(k => authRoutes.stack[k]?.route?.path)
].filter(Boolean));
// Import middleware
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// Middleware de securitate și optimizare
app.use(helmet()); // Securitate HTTP headers
app.use(compression()); // Compresie GZIP
app.use(morgan('dev')); // Logging în development
app.use(cors()); // Cross-Origin Resource Sharing
app.use(express.json({ limit: '10kb' })); // Limitare mărime request
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/menus', menuRoutes);
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running' });
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'success',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Handle undefined routes
app.all('*', (req, res, next) => {
    res.status(404).json({
        status: 'error',
        message: `Can't find ${req.originalUrl} on this server!`
    });
});

// Global error handling
app.use(errorHandler);

// Conectare la MongoDB
mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
        }
    });
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

module.exports = app;