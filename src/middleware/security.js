const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const config = require('../config/config');

/**
 * Rate limiting for authentication endpoints
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, 
    message: {
        success: false,
        error: 'Too many login attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * General API rate limiting
 */
const apiLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Slow down requests after hitting rate limit
 */
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // Allow 50 requests per 15 minutes, then...
    delayMs: (used, req) => {
        const delayAfter = req.slowDown.limit;
        return (used - delayAfter) * 500;
    },
    maxDelayMs: 20000, // Maximum delay of 20 seconds
    validate: { delayMs: false } // Disable the warning
});

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');
    
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Content Security Policy
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'"
    ].join('; ');
    
    res.setHeader('Content-Security-Policy', csp);
    
    next();
};

/**
 * Request size limiting middleware
 */
const requestSizeLimiter = (req, res, next) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
        return res.status(413).json({
            success: false,
            error: 'Request entity too large'
        });
    }
    
    next();
};

/**
 * IP whitelist middleware (for admin endpoints)
 */
const ipWhitelist = (allowedIPs = []) => {
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress;
        
        if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied from this IP address'
            });
        }
        
        next();
    };
};

/**
 * Request logging middleware for security monitoring
 */
const securityLogger = (req, res, next) => {
    const logger = require('../utils/logger').logger;
    
    // Log suspicious requests
    const suspiciousPatterns = [
        /\.\./, // Directory traversal
        /<script/i, // XSS attempts
        /union.*select/i, // SQL injection
        /eval\(/i, // Code injection
        /javascript:/i, // JavaScript injection
    ];
    
    const requestString = JSON.stringify({
        url: req.url,
        method: req.method,
        body: req.body,
        query: req.query,
        headers: req.headers
    });
    
    const isSuspicious = suspiciousPatterns.some(pattern => 
        pattern.test(requestString)
    );
    
    if (isSuspicious) {
        logger.warn('Suspicious request detected', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url,
            method: req.method,
            body: req.body,
            query: req.query
        });
    }
    
    next();
};

/**
 * Session security middleware
 */
const sessionSecurity = (req, res, next) => {
    // Ensure secure cookies in production
    if (config.NODE_ENV === 'production') {
        res.cookie('secure', true, {
            secure: true,
            httpOnly: true,
            sameSite: 'strict'
        });
    }
    
    next();
};

/**
 * CORS security configuration
 */
const corsSecurity = (req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = config.CORS_ORIGIN === '*' ? ['*'] : config.CORS_ORIGIN.split(',');
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
};

module.exports = {
    authLimiter,
    apiLimiter,
    speedLimiter,
    securityHeaders,
    requestSizeLimiter,
    ipWhitelist,
    securityLogger,
    sessionSecurity,
    corsSecurity
};
