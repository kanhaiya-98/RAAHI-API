const { supabase } = require('../config/database');
const smsService = require('../services/sms.service');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

/**
 * Generate random 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

/**
 * Send OTP to phone number
 * POST /api/auth/send-otp
 */
const sendOTP = async (req, res, next) => {
    try {
        // Validate input
        const schema = Joi.object({
            phone: Joi.string().required().pattern(/^\+?[1-9]\d{1,14}$/),
            role: Joi.string().valid('customer', 'provider').required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return sendError(res, error.details[0].message, 400);
        }

        const { phone, role } = value;

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Store OTP in database
        const { error: dbError } = await supabase
            .from('otp_verifications')
            .insert({
                phone,
                otp,
                expires_at: expiresAt.toISOString()
            });

        if (dbError) {
            logger.error('Failed to store OTP:', dbError);
            return sendError(res, 'Failed to generate OTP', 500);
        }

        // Send OTP via SMS
        try {
            await smsService.sendOTP(phone, otp);
        } catch (smsError) {
            logger.error('Failed to send SMS:', smsError);
            // Continue anyway - OTP is stored
        }

        logger.info('OTP sent successfully', { phone });

        return sendSuccess(res,
            { phone },
            'OTP sent successfully. Valid for 5 minutes.'
        );
    } catch (error) {
        next(error);
    }
};

/**
 * Verify OTP and create/login user
 * POST /api/auth/verify-otp
 */
const verifyOTP = async (req, res, next) => {
    try {
        // Validate input
        const schema = Joi.object({
            phone: Joi.string().required(),
            otp: Joi.string().required().length(6),
            role: Joi.string().valid('customer', 'provider').default('customer')
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return sendError(res, error.details[0].message, 400);
        }

        const { phone, otp, role } = value;

        // Get OTP from database
        const { data: otpRecord, error: otpError } = await supabase
            .from('otp_verifications')
            .select('*')
            .eq('phone', phone)
            .eq('otp', otp)
            .eq('verified', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (otpError || !otpRecord) {
            return sendError(res, 'Invalid OTP', 400);
        }

        // Check expiry
        if (new Date(otpRecord.expires_at) < new Date()) {
            return sendError(res, 'OTP expired', 400);
        }

        // Mark OTP as verified
        await supabase
            .from('otp_verifications')
            .update({ verified: true })
            .eq('id', otpRecord.id);

        // Check if user exists
        let { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .single();

        // Create user if doesn't exist
        if (userError || !user) {
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    phone,
                    role: role || 'customer',
                    is_verified: true
                })
                .select()
                .single();

            if (createError) {
                logger.error('Failed to create user:', createError);
                return sendError(res, 'Failed to create user', 500);
            }

            user = newUser;
            logger.info('New user created', { userId: user.id, phone });
        } else {
            // Update verification status
            await supabase
                .from('users')
                .update({ is_verified: true })
                .eq('id', user.id);
        }

        // Generate JWT token
        const token = generateToken(user.id);

        logger.info('User authenticated successfully', { userId: user.id });

        return sendSuccess(res, {
            token,
            user: {
                id: user.id,
                phone: user.phone,
                name: user.name,
                role: user.role,
                is_verified: user.is_verified
            }
        }, 'Authentication successful');
    } catch (error) {
        next(error);
    }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
    try {
        const user = req.user;

        // Get provider profile if applicable
        let providerProfile = null;
        if (user.role === 'provider') {
            const { data } = await supabase
                .from('provider_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            providerProfile = data;
        }

        return sendSuccess(res, {
            user: {
                id: user.id,
                phone: user.phone,
                name: user.name,
                email: user.email,
                role: user.role,
                location_lat: user.location_lat,
                location_lng: user.location_lng,
                address: user.address,
                is_verified: user.is_verified,
                provider_profile: providerProfile
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Logout (client-side token removal)
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
    try {
        // In a stateless JWT system, logout is handled client-side
        // This endpoint is mainly for logging purposes
        logger.info('User logged out', { userId: req.user?.id });

        return sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    sendOTP,
    verifyOTP,
    getMe,
    logout
};
