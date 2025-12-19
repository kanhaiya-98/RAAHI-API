const { sendSuccess, sendError } = require('../utils/response');
const providerRecommendationService = require('../services/providerRecommendation.service');
const bookingConfidenceService = require('../services/bookingConfidence.service');
const { supabase } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get AI-powered provider recommendation
 * POST /api/ai/recommend-provider
 */
const recommendProvider = async (req, res, next) => {
    try {
        const { task_id, user_priority } = req.body;

        if (!task_id) {
            return sendError(res, 'task_id is required', 400);
        }

        // Get task details
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', task_id)
            .single();

        if (taskError || !task) {
            return sendError(res, 'Task not found', 404);
        }

        // Get all bids for this task
        const { data: bids, error: bidsError } = await supabase
            .from('bids')
            .select(`
        *,
        provider:users!bids_provider_id_fkey(*),
        provider_profile:provider_profiles!bids_provider_id_fkey(*)
      `)
            .eq('task_id', task_id)
            .eq('status', 'pending');

        if (bidsError || !bids || bids.length === 0) {
            return sendError(res, 'No bids available for this task', 404);
        }

        // Format bids for AI
        const formattedBids = bids.map(bid => ({
            id: bid.id,
            bid_amount: bid.bid_amount,
            estimated_hours: bid.estimated_hours,
            message: bid.message,
            provider_id: bid.provider_id,
            provider_rating: bid.provider_profile?.rating || 0,
            provider_experience: bid.provider_profile?.experience_years || 0,
            provider_completed_jobs: bid.provider_profile?.completed_jobs || 0
        }));

        // Get AI recommendation
        const recommendation = await providerRecommendationService.recommendProvider(
            formattedBids,
            {
                service_category: task.ai_service_category,
                urgency: task.ai_urgency,
                complexity: task.ai_complexity,
                price_min: task.ai_price_min,
                price_max: task.ai_price_max
            },
            user_priority || 'best_value'
        );

        return sendSuccess(res, {
            task_id: task_id,
            recommendation: recommendation.recommendation,
            total_bids: bids.length
        }, 'Provider recommendation generated');

    } catch (error) {
        next(error);
    }
};

/**
 * Get booking confidence score
 * POST /api/ai/booking-confidence
 */
const getBookingConfidence = async (req, res, next) => {
    try {
        const { bid_id } = req.body;

        if (!bid_id) {
            return sendError(res, 'bid_id is required', 400);
        }

        // Get bid with all details
        const { data: bid, error: bidError } = await supabase
            .from('bids')
            .select(`
        *,
        task:tasks(*),
        provider:users!bids_provider_id_fkey(*),
        provider_profile:provider_profiles!bids_provider_id_fkey(*)
      `)
            .eq('id', bid_id)
            .single();

        if (bidError || !bid) {
            return sendError(res, 'Bid not found', 404);
        }

        // Generate confidence score
        const confidenceResult = await bookingConfidenceService.generateConfidenceScore(
            {
                rating: bid.provider_profile?.rating || 0,
                experience_years: bid.provider_profile?.experience_years || 0,
                total_jobs: bid.provider_profile?.total_jobs || 0,
                completed_jobs: bid.provider_profile?.completed_jobs || 0,
                verification_status: bid.provider_profile?.verification_status || 'pending'
            },
            {
                bid_amount: bid.bid_amount,
                estimated_hours: bid.estimated_hours,
                message: bid.message
            },
            {
                service_category: bid.task.ai_service_category,
                complexity: bid.task.ai_complexity,
                urgency: bid.task.ai_urgency,
                price_min: bid.task.ai_price_min,
                price_max: bid.task.ai_price_max
            }
        );

        return sendSuccess(res, {
            bid_id: bid_id,
            provider_name: bid.provider.name,
            ...confidenceResult.confidence
        }, 'Booking confidence score generated');

    } catch (error) {
        next(error);
    }
};

module.exports = {
    recommendProvider,
    getBookingConfidence
};
