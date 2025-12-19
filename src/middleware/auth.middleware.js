const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');
const { supabase } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Verify JWT token and authenticate user
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendError(res, 'No token provided', 401);
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return sendError(res, 'User not found', 401);
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return sendError(res, 'Token expired', 401);
        }
        if (error.name === 'JsonWebTokenError') {
            return sendError(res, 'Invalid token', 401);
        }
        logger.error('Authentication error:', error);
        return sendError(res, 'Authentication failed', 401);
    }
};

/**
 * Require specific role
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return sendError(res, 'Authentication required', 401);
        }

        if (!roles.includes(req.user.role)) {
            return sendError(res, `Access denied. Required role: ${roles.join(' or ')}`, 403);
        }

        next();
    };
};

/**
 * Optional authentication (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', decoded.userId)
            .single();

        if (user) {
            req.user = user;
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

module.exports = {
    authenticate,
    requireRole,
    optionalAuth
};
