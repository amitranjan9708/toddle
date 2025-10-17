// Test setup file
const config = require('../config/config');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_STORAGE = ':memory:'; // Use in-memory database for tests

// Disable rate limiting for tests
process.env.RATE_LIMIT_MAX_REQUESTS = '10000';
process.env.RATE_LIMIT_WINDOW_MS = '60000';

// Suppress console logs during tests unless explicitly needed
if (process.env.NODE_ENV === 'test') {
    // Store original console methods
    global.originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn
    };
    
    // Suppress console output during tests
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
}
