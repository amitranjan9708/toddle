const config = require('../config/config');

/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Handle Sequelize validation errors
 */
const handleSequelizeValidationError = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

/**
 * Handle Sequelize unique constraint errors
 */
const handleSequelizeUniqueConstraintError = (err) => {
    const value = err.errors[0].value;
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
};

/**
 * Handle Sequelize foreign key constraint errors
 */
const handleSequelizeForeignKeyConstraintError = (err) => {
    const message = 'Invalid reference. The referenced record does not exist.';
    return new AppError(message, 400);
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);

/**
 * Handle JWT expired errors
 */
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

/**
 * Send error response in development
 */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        success: false,
        error: err.message,
        stack: err.stack,
        details: err
    });
};

/**
 * Send error response in production
 */
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            error: err.message
        });
    } else {
        // Programming or other unknown error: don't leak error details
        console.error('ERROR 💥', err);
        res.status(500).json({
            success: false,
            error: 'Something went wrong!'
        });
    }
};

/**
 * Global error handling middleware
 */
const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (config.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        let error = { ...err };
        error.message = err.message;

        if (error.name === 'SequelizeValidationError') {
            error = handleSequelizeValidationError(error);
        } else if (error.name === 'SequelizeUniqueConstraintError') {
            error = handleSequelizeUniqueConstraintError(error);
        } else if (error.name === 'SequelizeForeignKeyConstraintError') {
            error = handleSequelizeForeignKeyConstraintError(error);
        } else if (error.name === 'JsonWebTokenError') {
            error = handleJWTError();
        } else if (error.name === 'TokenExpiredError') {
            error = handleJWTExpiredError();
        }

        sendErrorProd(error, res);
    }
};

/**
 * Handle unhandled routes
 */
const handleNotFound = (req, res, next) => {
    const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
    next(err);
};

/**
 * Async error wrapper
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

module.exports = {
    AppError,
    globalErrorHandler,
    handleNotFound,
    catchAsync
};
