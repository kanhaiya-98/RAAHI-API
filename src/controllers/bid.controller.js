const { supabase } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const smsService = require('../services/sms.service');
const logger = require('../utils/logger');
const Joi = require('joi');

/**
 * Create a bid
 * POST /api/bids
 */
const createBid = async (req, res, next) => {
    try {
        const schema = Joi.object({
            task_id: Joi.string().uuid().required(),
            bid_amount: Joi.number().required().min(1),
            estimated_hours: Joi.number().min(0.1),
            message: Joi.string().max(500)
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return sendError(res, error.details[0].message, 400);
        }

        const { task_id, bid_amount, estimated_hours, message } = value;
        const providerId = req.user.id;

        // Verify user is a provider
        if (req.user.role !== 'provider') {
            return sendError(res, 'Only providers can create bids', 403);
        }

        // Check if provider profile exists
        const { data: providerProfile } = await supabase
            .from('provider_profiles')
            .select('*')
            .eq('user_id', providerId)
            .single();

        if (!providerProfile) {
            return sendError(res, 'Please complete your provider profile first', 400);
        }

        // Get task
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .select('*, customer:users!tasks_customer_id_fkey(*)')
            .eq('id', task_id)
            .single();

        if (taskError || !task) {
            return sendError(res, 'Task not found', 404);
        }

        // Cannot bid on own task
        if (task.customer_id === providerId) {
            return sendError(res, 'Cannot bid on your own task', 400);
        }

        // Task must be open
        if (task.status !== 'open') {
            return sendError(res, 'Task is not open for bidding', 400);
        }

        // Validate bid amount (within 50% of AI estimate)
        if (task.ai_price_min && task.ai_price_max) {
            const minAllowed = task.ai_price_min * 0.5;
            const maxAllowed = task.ai_price_max * 1.5;
            if (bid_amount < minAllowed || bid_amount > maxAllowed) {
                logger.warn('Bid amount out of range', { bid_amount, minAllowed, maxAllowed });
                // Allow but log warning
            }
        }

        // Create bid
        const { data: bid, error: bidError } = await supabase
            .from('bids')
            .insert({
                task_id,
                provider_id: providerId,
                bid_amount,
                estimated_hours,
                message,
                status: 'pending'
            })
            .select()
            .single();

        if (bidError) {
            logger.error('Failed to create bid:', bidError);
            return sendError(res, 'Failed to create bid. You may have already bid on this task.', 400);
        }

        logger.info('Bid created successfully', { bidId: bid.id, taskId: task_id });

        // Send SMS to customer
        smsService.sendNewBidNotification(task.customer.phone, {
            bid_amount,
            provider_name: req.user.name || 'Provider',
            rating: providerProfile.rating
        }, task).catch(err => logger.error('Failed to send SMS:', err));

        return sendSuccess(res, { bid }, 'Bid submitted successfully', 201);
    } catch (error) {
        next(error);
    }
};

/**
 * Get bids for a task
 * GET /api/bids/task/:taskId
 */
const getBidsForTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;

        const { data: bids, error } = await supabase
            .from('bids')
            .select(`
        *,
        provider:users!bids_provider_id_fkey(id, name, phone),
        provider_profile:provider_profiles!bids_provider_id_fkey(rating, experience_years, completed_jobs, service_categories)
      `)
            .eq('task_id', taskId)
            .order('created_at', { ascending: false });

        if (error) {
            logger.error('Failed to fetch bids:', error);
            return sendError(res, 'Failed to fetch bids', 500);
        }

        return sendSuccess(res, { bids, count: bids.length });
    } catch (error) {
        next(error);
    }
};

/**
 * Get my bids (provider)
 * GET /api/bids/my-bids
 */
const getMyBids = async (req, res, next) => {
    try {
        const { status } = req.query;

        let query = supabase
            .from('bids')
            .select(`
        *,
        task:tasks!bids_task_id_fkey(*)
      `)
            .eq('provider_id', req.user.id);

        if (status) {
            query = query.eq('status', status);
        }

        const { data: bids, error } = await query.order('created_at', { ascending: false });

        if (error) {
            return sendError(res, 'Failed to fetch bids', 500);
        }

        return sendSuccess(res, { bids, count: bids.length });
    } catch (error) {
        next(error);
    }
};

/**
 * Accept a bid
 * POST /api/bids/:bidId/accept
 */
const acceptBid = async (req, res, next) => {
    try {
        const { bidId } = req.params;

        // Get bid with task
        const { data: bid, error: bidError } = await supabase
            .from('bids')
            .select(`
        *,
        task:tasks!bids_task_id_fkey(*),
        provider:users!bids_provider_id_fkey(*)
      `)
            .eq('id', bidId)
            .single();

        if (bidError || !bid) {
            return sendError(res, 'Bid not found', 404);
        }

        // Verify user is the task customer
        if (bid.task.customer_id !== req.user.id) {
            return sendError(res, 'Unauthorized', 403);
        }

        // Bid must be pending
        if (bid.status !== 'pending') {
            return sendError(res, 'Bid is no longer available', 400);
        }

        // Start transaction
        // 1. Accept the bid
        const { error: updateError } = await supabase
            .from('bids')
            .update({ status: 'accepted' })
            .eq('id', bidId);

        if (updateError) {
            return sendError(res, 'Failed to accept bid', 500);
        }

        // 2. Reject other bids for this task
        await supabase
            .from('bids')
            .update({ status: 'rejected' })
            .eq('task_id', bid.task_id)
            .eq('status', 'pending')
            .neq('id', bidId);

        // 3. Update task status
        await supabase
            .from('tasks')
            .update({ status: 'assigned' })
            .eq('id', bid.task_id);

        // 4. Create booking
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .insert({
                task_id: bid.task_id,
                customer_id: bid.task.customer_id,
                provider_id: bid.provider_id,
                bid_id: bidId,
                payment_amount: bid.bid_amount,
                status: 'scheduled'
            })
            .select()
            .single();

        if (bookingError) {
            logger.error('Failed to create booking:', bookingError);
            return sendError(res, 'Failed to create booking', 500);
        }

        logger.info('Bid accepted and booking created', { bidId, bookingId: booking.id });

        // Send SMS to accepted provider
        smsService.sendBidAcceptedNotification(
            bid.provider.phone,
            { ...booking, address: bid.task.address },
            req.user.name || 'Customer'
        ).catch(err => logger.error('SMS failed:', err));

        // Notify rejected providers
        const { data: rejectedBids } = await supabase
            .from('bids')
            .select('provider:users!bids_provider_id_fkey(phone)')
            .eq('task_id', bid.task_id)
            .eq('status', 'rejected');

        if (rejectedBids) {
            rejectedBids.forEach(rb => {
                smsService.sendBidRejectedNotification(rb.provider.phone, bid.task_id)
                    .catch(err => logger.error('SMS failed:', err));
            });
        }

        return sendSuccess(res, { booking }, 'Bid accepted and booking created', 201);
    } catch (error) {
        next(error);
    }
};

/**
 * Reject a bid
 * POST /api/bids/:bidId/reject
 */
const rejectBid = async (req, res, next) => {
    try {
        const { bidId } = req.params;

        const { data: bid, error } = await supabase
            .from('bids')
            .update({ status: 'rejected' })
            .eq('id', bidId)
            .select('*, task:tasks!bids_task_id_fkey(customer_id)')
            .single();

        if (error || !bid) {
            return sendError(res, 'Failed to reject bid', 400);
        }

        // Verify user is the task customer
        if (bid.task.customer_id !== req.user.id) {
            return sendError(res, 'Unauthorized', 403);
        }

        return sendSuccess(res, null, 'Bid rejected');
    } catch (error) {
        next(error);
    }
};

/**
 * Withdraw a bid
 * DELETE /api/bids/:bidId
 */
const withdrawBid = async (req, res, next) => {
    try {
        const { bidId } = req.params;

        const { data: bid, error } = await supabase
            .from('bids')
            .update({ status: 'withdrawn' })
            .eq('id', bidId)
            .eq('provider_id', req.user.id)
            .eq('status', 'pending')
            .select()
            .single();

        if (error || !bid) {
            return sendError(res, 'Failed to withdraw bid. Bid may be already accepted.', 400);
        }

        return sendSuccess(res, null, 'Bid withdrawn successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createBid,
    getBidsForTask,
    getMyBids,
    acceptBid,
    rejectBid,
    withdrawBid
};
