const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

/**
 * Validation rules for authentication
 */
const validateLogin = [
    body('username')
        .notEmpty()
        .withMessage('Username is required')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .trim(),
    body('role')
        .isIn(['TUTOR', 'STUDENT'])
        .withMessage('Role must be either TUTOR or STUDENT'),
    handleValidationErrors
];

/**
 * Validation rules for assignment creation
 */
const validateCreateAssignment = [
    body('description')
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters')
        .trim(),
    body('studentIds')
        .optional()
        .isArray()
        .withMessage('Student IDs must be an array')
        .custom((value) => {
            if (value && value.length > 0) {
                const isValid = value.every(id => Number.isInteger(id) && id > 0);
                if (!isValid) {
                    throw new Error('All student IDs must be positive integers');
                }
            }
            return true;
        }),
    body('publishedAt')
        .optional()
        .isISO8601()
        .withMessage('Published date must be a valid ISO 8601 date')
        .custom((value) => {
            if (value && new Date(value) < new Date()) {
                throw new Error('Published date cannot be in the past');
            }
            return true;
        }),
    body('deadline')
        .optional()
        .isISO8601()
        .withMessage('Deadline must be a valid ISO 8601 date')
        .custom((value, { req }) => {
            if (value && req.body.publishedAt) {
                const deadline = new Date(value);
                const publishedAt = new Date(req.body.publishedAt);
                if (deadline <= publishedAt) {
                    throw new Error('Deadline must be after published date');
                }
            }
            return true;
        }),
    handleValidationErrors
];

/**
 * Validation rules for assignment update
 */
const validateUpdateAssignment = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Assignment ID must be a positive integer'),
    body('description')
        .optional()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters')
        .trim(),
    body('studentIds')
        .optional()
        .isArray()
        .withMessage('Student IDs must be an array'),
    body('publishedAt')
        .optional()
        .isISO8601()
        .withMessage('Published date must be a valid ISO 8601 date'),
    body('deadline')
        .optional()
        .isISO8601()
        .withMessage('Deadline must be a valid ISO 8601 date'),
    handleValidationErrors
];

/**
 * Validation rules for assignment deletion
 */
const validateDeleteAssignment = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Assignment ID must be a positive integer'),
    handleValidationErrors
];

/**
 * Validation rules for assignment details
 */
const validateGetAssignment = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Assignment ID must be a positive integer'),
    handleValidationErrors
];

/**
 * Validation rules for assignment feed
 */
const validateAssignmentFeed = [
    query('publishedAt')
        .optional()
        .isIn(['SCHEDULED', 'ONGOING'])
        .withMessage('PublishedAt filter must be either SCHEDULED or ONGOING'),
    query('status')
        .optional()
        .isIn(['ALL', 'PENDING', 'OVERDUE', 'SUBMITTED'])
        .withMessage('Status filter must be one of: ALL, PENDING, OVERDUE, SUBMITTED'),
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
];

/**
 * Validation rules for submission
 */
const validateSubmission = [
    body('assignmentId')
        .isInt({ min: 1 })
        .withMessage('Assignment ID must be a positive integer'),
    body('remark')
        .notEmpty()
        .withMessage('Remark is required')
        .isLength({ min: 10, max: 2000 })
        .withMessage('Remark must be between 10 and 2000 characters')
        .trim(),
    handleValidationErrors
];

/**
 * Sanitize input data
 */
const sanitizeInput = (req, res, next) => {
    // Remove any potential XSS attempts
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        }
        if (typeof obj === 'object' && obj !== null) {
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    obj[key] = sanitize(obj[key]);
                }
            }
        }
        return obj;
    };

    if (req.body) {
        req.body = sanitize(req.body);
    }
    if (req.query) {
        req.query = sanitize(req.query);
    }
    if (req.params) {
        req.params = sanitize(req.params);
    }

    next();
};

module.exports = {
    validateLogin,
    validateCreateAssignment,
    validateUpdateAssignment,
    validateDeleteAssignment,
    validateGetAssignment,
    validateAssignmentFeed,
    validateSubmission,
    sanitizeInput,
    handleValidationErrors
};
