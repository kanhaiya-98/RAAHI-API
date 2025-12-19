const { supabase } = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const smsService = require('../services/sms.service');
const logger = require('../utils/logger');

/**
 * Get bookings
 * GET /api/bookings
 */
const getBookings = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('bookings')
            .select(`
        *,
        task:tasks(*),
        customer:users!bookings_customer_id_fkey(id, name, phone),
        provider:users!bookings_provider_id_fkey(id, name, phone)
      `, { count: 'exact' });

        // Filter by role
        if (req.user.role === 'customer') {
            query = query.eq('customer_id', req.user.id);
        } else if (req.user.role === 'provider') {
            query = query.eq('provider_id', req.user.id);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data: bookings, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (error) {
            return sendError(res, 'Failed to fetch bookings', 500);
        }

        return sendPaginated(res, bookings, page, limit, count);
    } catch (error) {
        next(error);
    }
};

/**
 * Get booking by ID
 * GET /api/bookings/:bookingId
 */
const getBooking = async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        const { data: booking, error } = await supabase
            .from('bookings')
            .select(`
        *,
        task:tasks(*),
        customer:users!bookings_customer_id_fkey(*),
        provider:users!bookings_provider_id_fkey(*),
        bid:bids(*)
      `)
            .eq('id', bookingId)
            .single();

        if (error || !booking) {
            return sendError(res, 'Booking not found', 404);
        }

        // Check authorization
        if (booking.customer_id !== req.user.id && booking.provider_id !== req.user.id) {
            return sendError(res, 'Unauthorized', 403);
        }

        return sendSuccess(res, { booking });
    } catch (error) {
        next(error);
    }
};

/**
 * Start booking
 * PATCH /api/bookings/:bookingId/start
 */
const startBooking = async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        const { data: booking, error } = await supabase
            .from('bookings')
            .update({ status: 'in_progress' })
            .eq('id', bookingId)
            .eq('provider_id', req.user.id)
            .eq('status', 'scheduled')
            .select('*, customer:users!bookings_customer_id_fkey(phone), task:tasks(*)')
            .single();

        if (error || !booking) {
            return sendError(res, 'Failed to start booking or unauthorized', 400);
        }

        // Update task status
        await supabase
            .from('tasks')
            .update({ status: 'in_progress' })
            .eq('id', booking.task_id);

        // Notify customer
        smsService.sendSMS(
            booking.customer.phone,
            `RAAHI: Your service has started! Provider is on the way.`
        ).catch(err => logger.error('SMS failed:', err));

        return sendSuccess(res, { booking }, 'Booking started');
    } catch (error) {
        next(error);
    }
};

/**
 * Complete booking
 * PATCH /api/bookings/:bookingId/complete
 */
const completeBooking = async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        const { data: booking, error } = await supabase
            .from('bookings')
            .update({
                status: 'completed',
                completion_time: new Date().toISOString()
            })
            .eq('id', bookingId)
            .eq('provider_id', req.user.id)
            .eq('status', 'in_progress')
            .select('*, customer:users!bookings_customer_id_fkey(phone), provider:users!bookings_provider_id_fkey(name), task:tasks(*)')
            .single();

        if (error || !booking) {
            return sendError(res, 'Failed to complete booking or unauthorized', 400);
        }

        // Update task status
        await supabase
            .from('tasks')
            .update({ status: 'completed' })
            .eq('id', booking.task_id);

        // Update provider completed jobs count
        await supabase.rpc('increment_completed_jobs', { provider_user_id: req.user.id });

        // Notify customer
        smsService.sendJobCompletedNotification(
            booking.customer.phone,
            booking.provider.name || 'Provider'
        ).catch(err => logger.error('SMS failed:', err));

        return sendSuccess(res, { booking }, 'Booking completed');
    } catch (error) {
        next(error);
    }
};

/**
 * Cancel booking
 * PATCH /api/bookings/:bookingId/cancel
 */
const cancelBooking = async (req, res, next) => {
    try {
        const { bookingId } = req.params;
        const { reason } = req.body;

        // Get booking
        const { data: existing, error: fetchError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (fetchError || !existing) {
            return sendError(res, 'Booking not found', 404);
        }

        // Check authorization
        if (existing.customer_id !== req.user.id && existing.provider_id !== req.user.id) {
            return sendError(res, 'Unauthorized', 403);
        }

        // Can only cancel if scheduled
        if (existing.status !== 'scheduled') {
            return sendError(res, 'Can only cancel scheduled bookings', 400);
        }

        // Cancel booking
        const { data: booking, error } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId)
            .select()
            .single();

        if (error) {
            return sendError(res, 'Failed to cancel booking', 500);
        }

        // Update task back to open
        await supabase
            .from('tasks')
            .update({ status: 'open' })
            .eq('id', booking.task_id);

        logger.info('Booking cancelled', { bookingId, reason });

        return sendSuccess(res, { booking }, 'Booking cancelled');
    } catch (error) {
        next(error);
    }
};

/**
 * Get booking timeline
 * GET /api/bookings/:bookingId/timeline
 */
const getBookingTimeline = async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        // This would typically fetch from an audit log table
        // For now, return basic timeline from booking data
        const { data: booking, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (error || !booking) {
            return sendError(res, 'Booking not found', 404);
        }

        const timeline = [
            {
                event: 'Booking Created',
                timestamp: booking.created_at,
                status: 'scheduled'
            }
        ];

        if (booking.status === 'in_progress' || booking.status === 'completed') {
            timeline.push({
                event: 'Job Started',
                timestamp: booking.updated_at,
                status: 'in_progress'
            });
        }

        if (booking.status === 'completed') {
            timeline.push({
                event: 'Job Completed',
                timestamp: booking.completion_time,
                status: 'completed'
            });
        }

        if (booking.status === 'cancelled') {
            timeline.push({
                event: 'Booking Cancelled',
                timestamp: booking.updated_at,
                status: 'cancelled'
            });
        }

        return sendSuccess(res, { timeline });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getBookings,
    getBooking,
    startBooking,
    completeBooking,
    cancelBooking,
    getBookingTimeline
};
