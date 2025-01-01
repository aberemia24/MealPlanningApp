// config/swagger.js
const swaggerJsDoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Meal Planning API',
            version: '1.0.0',
            description: 'API pentru aplicația de planificare a meniurilor',
            contact: {
                name: 'API Support',
                email: 'support@mealplanning.com'
            }
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:5000',
                description: 'Server local'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: [
        './routes/*.js',
        './models/*.js',
        './controllers/*.js'
    ]
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;