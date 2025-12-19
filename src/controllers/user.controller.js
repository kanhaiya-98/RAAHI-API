const { supabase } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../utils/logger');
const Joi = require('joi');

/**
 * Get user profile
 * GET /api/users/profile
 */
const getProfile = async (req, res, next) => {
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
                ...user,
                provider_profile: providerProfile
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update user profile
 * PATCH /api/users/profile
 */
const updateProfile = async (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().min(2).max(100),
            email: Joi.string().email(),
            address: Joi.string().max(500),
            location_lat: Joi.number().min(-90).max(90),
            location_lng: Joi.number().min(-180).max(180)
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return sendError(res, error.details[0].message, 400);
        }

        const { data: user, error: updateError } = await supabase
            .from('users')
            .update(value)
            .eq('id', req.user.id)
            .select()
            .single();

        if (updateError) {
            return sendError(res, 'Failed to update profile', 500);
        }

        return sendSuccess(res, { user }, 'Profile updated successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Create/update provider profile
 * POST /api/users/provider-profile
 */
const createProviderProfile = async (req, res, next) => {
    try {
        if (req.user.role !== 'provider') {
            return sendError(res, 'Only providers can create provider profiles', 403);
        }

        const schema = Joi.object({
            service_categories: Joi.array().items(Joi.string()).min(1).required(),
            experience_years: Joi.number().min(0).max(50),
            bio: Joi.string().max(1000)
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return sendError(res, error.details[0].message, 400);
        }

        // Check if profile exists
        const { data: existing } = await supabase
            .from('provider_profiles')
            .select('id')
            .eq('user_id', req.user.id)
            .single();

        let profile;
        if (existing) {
            // Update
            const { data, error: updateError } = await supabase
                .from('provider_profiles')
                .update(value)
                .eq('user_id', req.user.id)
                .select()
                .single();

            if (updateError) {
                return sendError(res, 'Failed to update profile', 500);
            }
            profile = data;
        } else {
            // Create
            const { data, error: createError } = await supabase
                .from('provider_profiles')
                .insert({
                    user_id: req.user.id,
                    ...value
                })
                .select()
                .single();

            if (createError) {
                return sendError(res, 'Failed to create profile', 500);
            }
            profile = data;
        }

        return sendSuccess(res, { profile }, 'Provider profile saved successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get provider by ID (public profile)
 * GET /api/users/providers/:providerId
 */
const getProvider = async (req, res, next) => {
    try {
        const { providerId } = req.params;

        const { data: profile, error } = await supabase
            .from('provider_profiles')
            .select(`
        *,
        user:users!provider_profiles_user_id_fkey(id, name)
      `)
            .eq('user_id', providerId)
            .single();

        if (error || !profile) {
            return sendError(res, 'Provider not found', 404);
        }

        // Get reviews
        const { data: reviews } = await supabase
            .from('reviews')
            .select('id, rating, comment, created_at')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false })
            .limit(5);

        return sendSuccess(res, {
            provider: {
                id: profile.user.id,
                name: profile.user.name,
                service_categories: profile.service_categories,
                experience_years: profile.experience_years,
                rating: profile.rating,
                total_jobs: profile.total_jobs,
                completed_jobs: profile.completed_jobs,
                bio: profile.bio,
                verification_status: profile.verification_status,
                recent_reviews: reviews
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get nearby providers
 * GET /api/users/providers/nearby
 */
const getNearbyProviders = async (req, res, next) => {
    try {
        const { lat, lng, service_category, radius = 5 } = req.query;

        if (!lat || !lng) {
            return sendError(res, 'Location (lat, lng) is required', 400);
        }

        let query = supabase
            .from('provider_profiles')
            .select('*, user:users!provider_profiles_user_id_fkey(*)')
            .eq('verification_status', 'verified');

        if (service_category) {
            query = query.contains('service_categories', [service_category]);
        }

        const { data: providers, error } = await query;

        if (error) {
            return sendError(res, 'Failed to fetch providers', 500);
        }

        // Filter by distance and calculate
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        const nearbyProviders = providers
            .filter(p => {
                if (!p.user.location_lat || !p.user.location_lng) return false;
                const distance = calculateDistance(
                    parseFloat(lat),
                    parseFloat(lng),
                    p.user.location_lat,
                    p.user.location_lng
                );
                return distance <= parseFloat(radius);
            })
            .map(p => ({
                id: p.user.id,
                name: p.user.name,
                service_categories: p.service_categories,
                experience_years: p.experience_years,
                rating: p.rating,
                completed_jobs: p.completed_jobs,
                distance: calculateDistance(
                    parseFloat(lat),
                    parseFloat(lng),
                    p.user.location_lat,
                    p.user.location_lng
                ).toFixed(2)
            }))
            .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

        return sendSuccess(res, { providers: nearbyProviders, count: nearbyProviders.length });
    } catch (error) {
        next(error);
    }
};

/**
 * Update location
 * PATCH /api/users/location
 */
const updateLocation = async (req, res, next) => {
    try {
        const schema = Joi.object({
            lat: Joi.number().required().min(-90).max(90),
            lng: Joi.number().required().min(-180).max(180),
            address: Joi.string().required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return sendError(res, error.details[0].message, 400);
        }

        const { data: user, error: updateError } = await supabase
            .from('users')
            .update({
                location_lat: value.lat,
                location_lng: value.lng,
                address: value.address
            })
            .eq('id', req.user.id)
            .select()
            .single();

        if (updateError) {
            return sendError(res, 'Failed to update location', 500);
        }

        return sendSuccess(res, { user }, 'Location updated successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Get provider stats
 * GET /api/users/stats
 */
const getProviderStats = async (req, res, next) => {
    try {
        if (req.user.role !== 'provider') {
            return sendError(res, 'Only providers can view stats', 403);
        }

        const providerId = req.user.id;

        // Get profile
        const { data: profile } = await supabase
            .from('provider_profiles')
            .select('*')
            .eq('user_id', providerId)
            .single();

        // Get bid stats
        const { data: bids } = await supabase
            .from('bids')
            .select('status')
            .eq('provider_id', providerId);

        const bidStats = {
            total_bids: bids?.length || 0,
            accepted_bids: bids?.filter(b => b.status === 'accepted').length || 0,
            pending_bids: bids?.filter(b => b.status === 'pending').length || 0
        };

        // Get earnings (sum of completed bookings)
        const { data: bookings } = await supabase
            .from('bookings')
            .select('payment_amount')
            .eq('provider_id', providerId)
            .eq('status', 'completed')
            .eq('payment_status', 'paid');

        const totalEarnings = bookings?.reduce((sum, b) => sum + (b.payment_amount || 0), 0) || 0;

        return sendSuccess(res, {
            stats: {
                ...bidStats,
                completed_jobs: profile?.completed_jobs || 0,
                current_rating: profile?.rating || 0.0,
                total_earnings: totalEarnings,
                verification_status: profile?.verification_status || 'pending'
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    createProviderProfile,
    getProvider,
    getNearbyProviders,
    updateLocation,
    getProviderStats
};
