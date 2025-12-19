const logger = require('../utils/logger');
const { sendError } = require('../utils/response');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error(`Error: ${err.message}`, {
        path: req.path,
        method: req.method,
        stack: err.stack
    });

    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        const errors = Object.values(err.errors).map(e => e.message);
        return sendError(res, message, statusCode, errors);
    }

    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    if (err.code === '23505') { // Postgres unique violation
        statusCode = 409;
        message = 'Resource already exists';
    }

    if (err.code === '23503') { // Postgres foreign key violation
        statusCode = 400;
        message = 'Invalid reference';
    }

    // Send error response
    return sendError(res, message, statusCode);
};

/**
 * Handle 404 errors
 */
const notFound = (req, res) => {
    return sendError(res, `Route ${req.originalUrl} not found`, 404);
};

module.exports = {
    errorHandler,
    notFound
};
