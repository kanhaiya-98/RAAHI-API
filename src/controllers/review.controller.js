const { supabase } = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const logger = require('../utils/logger');
const Joi = require('joi');

/**
 * Create review
 * POST /api/reviews
 */
const createReview = async (req, res, next) => {
    try {
        if (req.user.role !== 'customer') {
            return sendError(res, 'Only customers can create reviews', 403);
        }

        const schema = Joi.object({
            booking_id: Joi.string().uuid().required(),
            rating: Joi.number().required().min(1).max(5),
            comment: Joi.string().max(1000)
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return sendError(res, error.details[0].message, 400);
        }

        const { booking_id, rating, comment } = value;

        // Get booking
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', booking_id)
            .single();

        if (bookingError || !booking) {
            return sendError(res, 'Booking not found', 404);
        }

        // Verify user is the customer
        if (booking.customer_id !== req.user.id) {
            return sendError(res, 'Unauthorized', 403);
        }

        // Booking must be completed
        if (booking.status !== 'completed') {
            return sendError(res, 'Can only review completed bookings', 400);
        }

        // Create review
        const { data: review, error: reviewError } = await supabase
            .from('reviews')
            .insert({
                booking_id,
                customer_id: req.user.id,
                provider_id: booking.provider_id,
                rating,
                comment
            })
            .select()
            .single();

        if (reviewError) {
            if (reviewError.code === '23505') { // Unique violation
                return sendError(res, 'You have already reviewed this booking', 400);
            }
            return sendError(res, 'Failed to create review', 500);
        }

        // Update provider rating
        await updateProviderRating(booking.provider_id);

        logger.info('Review created', { reviewId: review.id, providerId: booking.provider_id });

        return sendSuccess(res, { review }, 'Review submitted successfully', 201);
    } catch (error) {
        next(error);
    }
};

/**
 * Get reviews for a provider
 * GET /api/reviews/provider/:providerId
 */
const getProviderReviews = async (req, res, next) => {
    try {
        const { providerId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const { data: reviews, error, count } = await supabase
            .from('reviews')
            .select(`
        *,
        customer:users!reviews_customer_id_fkey(name),
        booking:bookings(task:tasks(task_description))
      `, { count: 'exact' })
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (error) {
            return sendError(res, 'Failed to fetch reviews', 500);
        }

        // Only show first name for privacy
        const sanitizedReviews = reviews.map(r => ({
            ...r,
            customer: {
                name: r.customer?.name?.split(' ')[0] || 'Anonymous'
            }
        }));

        return sendPaginated(res, sanitizedReviews, page, limit, count);
    } catch (error) {
        next(error);
    }
};

/**
 * Get review for a booking
 * GET /api/reviews/booking/:bookingId
 */
const getBookingReview = async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        const { data: review, error } = await supabase
            .from('reviews')
            .select(`
        *,
        customer:users!reviews_customer_id_fkey(name),
        provider:users!reviews_provider_id_fkey(name)
      `)
            .eq('booking_id', bookingId)
            .single();

        if (error || !review) {
            return sendError(res, 'Review not found', 404);
        }

        return sendSuccess(res, { review });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete review
 * DELETE /api/reviews/:reviewId
 */
const deleteReview = async (req, res, next) => {
    try {
        const { reviewId } = req.params;

        // Get review
        const { data: review, error: fetchError } = await supabase
            .from('reviews')
            .select('*')
            .eq('id', reviewId)
            .single();

        if (fetchError || !review) {
            return sendError(res, 'Review not found', 404);
        }

        // Verify user is the customer
        if (review.customer_id !== req.user.id) {
            return sendError(res, 'Unauthorized', 403);
        }

        // Check if within 24 hours
        const createdAt = new Date(review.created_at);
        const now = new Date();
        const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

        if (hoursSinceCreation > 24) {
            return sendError(res, 'Can only delete reviews within 24 hours of posting', 400);
        }

        // Delete review
        const { error: deleteError } = await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId);

        if (deleteError) {
            return sendError(res, 'Failed to delete review', 500);
        }

        // Recalculate provider rating
        await updateProviderRating(review.provider_id);

        return sendSuccess(res, null, 'Review deleted successfully');
    } catch (error) {
        next(error);
    }
};

/**
 * Helper: Update provider rating
 */
const updateProviderRating = async (providerId) => {
    try {
        // Get all reviews for provider
        const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('provider_id', providerId);

        if (!reviews || reviews.length === 0) {
            // No reviews, set rating to 0
            await supabase
                .from('provider_profiles')
                .update({ rating: 0.0 })
                .eq('user_id', providerId);
            return;
        }

        // Calculate average
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = (totalRating / reviews.length).toFixed(2);

        // Update provider profile
        await supabase
            .from('provider_profiles')
            .update({ rating: parseFloat(avgRating) })
            .eq('user_id', providerId);

        logger.info('Provider rating updated', { providerId, avgRating, reviewCount: reviews.length });
    } catch (error) {
        logger.error('Failed to update provider rating:', error);
    }
};

module.exports = {
    createReview,
    getProviderReviews,
    getBookingReview,
    deleteReview
};
