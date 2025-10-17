const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { ApolloServer } = require('apollo-server-express');

// Import configurations and middleware
const config = require('./config/config');
const { logger, stream } = require('./utils/logger');
const { globalErrorHandler, handleNotFound } = require('./middleware/errorHandler');
const { sanitizeInput } = require('./middleware/validation');
const { 
    authLimiter, 
    apiLimiter, 
    speedLimiter, 
    securityHeaders, 
    requestSizeLimiter, 
    securityLogger, 
    corsSecurity 
} = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/authRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');

// Import GraphQL
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

// Import authentication middleware
const { authenticateToken } = require('./middleware/auth');

async function createServer() {
    const app = express();

    // Trust proxy for accurate IP addresses
    app.set('trust proxy', 1);

    // Security headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }));

    // Custom security headers
    app.use(securityHeaders);

    // CORS security
    app.use(corsSecurity);

    // Request size limiting
    app.use(requestSizeLimiter);

    // Security logging
    app.use(securityLogger);

    // Rate limiting (disabled in test environment)
    if (config.NODE_ENV !== 'test') {
        app.use('/api/auth', authLimiter);
        app.use('/api', apiLimiter);
        app.use(speedLimiter);
    }

    // Logging middleware
    app.use(morgan('combined', { stream }));

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Input sanitization
    app.use(sanitizeInput);

    // Health check endpoint
    app.get('/api/health', (req, res) => {
        res.json({ 
            success: true,
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: config.NODE_ENV
        });
    });

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/assignments', assignmentRoutes);

    // Setup ApolloServer for GraphQL
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }) => {
            // Extract token from Authorization header
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
            
            let user = null;
            if (token) {
                try {
                    const jwt = require('jsonwebtoken');
                    user = jwt.verify(token, config.JWT_SECRET);
                } catch (error) {
                    // Token is invalid or expired, user remains null
                    logger.warn('Invalid GraphQL token:', error.message);
                }
            }
            
            return { user };
        },
        formatError: (err) => {
            logger.error('GraphQL Error:', err);
            return {
                message: err.message,
                code: err.extensions?.code,
                path: err.path
            };
        },
        introspection: config.NODE_ENV !== 'production',
        playground: config.NODE_ENV !== 'production'
    });

    await server.start();
    server.applyMiddleware({ 
        app, 
        path: '/graphql',
        cors: false // CORS is handled by express middleware
    });

    // Handle unhandled routes
    app.all('*', handleNotFound);

    // Global error handling middleware
    app.use(globalErrorHandler);

    return app;
}

module.exports = createServer;
