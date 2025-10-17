require('dotenv').config();

const config = {
    // Server Configuration
    PORT: process.env.PORT || 4000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET || 'bkubvsdukfvbaurkghserergahier',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    
    // Database Configuration
    DB_DIALECT: process.env.DB_DIALECT || 'sqlite',
    DB_STORAGE: process.env.DB_STORAGE || './database.sqlite',
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || 5432,
    DB_NAME: process.env.DB_NAME || 'virtual_classroom',
    DB_USERNAME: process.env.DB_USERNAME || '',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    
    // Logging Configuration
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    
    // Pagination Defaults
    DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE) || 10,
    MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE) || 100,
    
    
    // CORS Configuration
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

// Validation
if (config.NODE_ENV === 'production') {
    if (config.JWT_SECRET === 'bkubvsdukfvbaurkghserergahier') {
        throw new Error('JWT_SECRET must be set in production environment');
    }
}

module.exports = config;
