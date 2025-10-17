const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false,
            error: 'Access token is required' 
        });
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ 
            success: false,
            error: 'Invalid or expired token' 
        });
    }
};

/**
 * Middleware to authorize specific roles
 */
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                error: 'Authentication required' 
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false,
                error: `Access denied. Required roles: ${roles.join(', ')}` 
            });
        }

        next();
    };
};

/**
 * Middleware to authorize tutors only
 */
const authorizeTutor = authorizeRoles('TUTOR');

/**
 * Middleware to authorize students only
 */
const authorizeStudent = authorizeRoles('STUDENT');

module.exports = {
    authenticateToken,
    authorizeRoles,
    authorizeTutor,
    authorizeStudent
};
