const { supabase } = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const taskClassificationService = require('../services/taskClassification.service');
const priceEstimationService = require('../services/priceEstimation.service');
const smsService = require('../services/sms.service');
const logger = require('../utils/logger');
const Joi = require('joi');

/**
 * Helpers
 */

// Calculate distance between two coordinates in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Create new task
 * POST /api/tasks
 */
const createTask = async (req, res, next) => {
    try {
        // Validate input
        const schema = Joi.object({
            task_description: Joi.string().required().min(10),
            location: Joi.object({
                lat: Joi.number().required().min(-90).max(90),
                lng: Joi.number().required().min(-180).max(180),
                address: Joi.string().required()
            }).required(),
            photo_urls: Joi.array().items(Joi.string().uri())
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return sendError(res, error.details[0].message, 400);
        }

        const { task_description, location, photo_urls } = value;
        const customerId = req.user.id;

        // Verify user is a customer
        if (req.user.role !== 'customer') {
            return sendError(res, 'Only customers can create tasks', 403);
        }

        // AI: Classify task
        logger.info('Classifying task...', { customerId });
        const classification = await taskClassificationService.classifyTask(
            task_description,
            location.address
        );

        // AI: Estimate price
        logger.info('Estimating price...', { category: classification.service_category });
        const priceEstimate = await priceEstimationService.estimatePrice(
            classification.service_category,
            classification.complexity,
            classification.issue_type,
            location.address
        );

        // Create task in database
        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .insert({
                customer_id: customerId,
                task_description,
                ai_service_category: classification.service_category,
                ai_issue_type: classification.issue_type,
                ai_complexity: classification.complexity,
                ai_urgency: classification.urgency,
                ai_price_min: priceEstimate.min_price,
                ai_price_max: priceEstimate.max_price,
                location_lat: location.lat,
                location_lng: location.lng,
                address: location.address,
                photo_urls: photo_urls || [],
                status: 'open'
            })
            .select()
            .single();

        if (taskError) {
            logger.error('Failed to create task:', taskError);
            return sendError(res, 'Failed to create task', 500);
        }

        logger.info('Task created successfully', { taskId: task.id });

        // Find nearby providers (within 5km)
        const { data: providers } = await supabase
            .from('provider_profiles')
            .select('*, users!inner(*)')
            .contains('service_categories', [classification.service_category])
            .eq('verification_status', 'verified');

        // Notify nearby providers via SMS
        if (providers && providers.length > 0) {
            const nearbyProviders = providers.filter(p => {
                if (!p.users.location_lat || !p.users.location_lng) return false;
                const distance = calculateDistance(
                    location.lat,
                    location.lng,
                    p.users.location_lat,
                    p.users.location_lng
                );
                return distance <= 5; // 5km radius
            });

            // Send SMS notifications asynchronously
            nearbyProviders.forEach(provider => {
                smsService.sendTaskPostedNotification(provider.users.phone, task)
                    .catch(err => logger.error('Failed to send SMS:', err));
            });

            logger.info(`Notified ${nearbyProviders.length} nearby providers`);
        }

        return sendSuccess(res, {
            task: {
                id: task.id,
                task_description: task.task_description,
                ai_classification: {
                    service_category: task.ai_service_category,
                    issue_type: task.ai_issue_type,
                    complexity: task.ai_complexity,
                    urgency: task.ai_urgency
                },
                price_estimate: {
                    min: task.ai_price_min,
                    max: task.ai_price_max
                },
                location: {
                    lat: task.location_lat,
                    lng: task.location_lng,
                    address: task.address
                },
                status: task.status,
                created_at: task.created_at
            }
        }, 'Task created successfully', 201);
    } catch (error) {
        next(error);
    }
};

/**
 * Get task by ID
 * GET /api/tasks/:taskId
 */
const getTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;

        // Get task with bids
        const { data: task, error } = await supabase
            .from('tasks')
            .select(`
        *,
        customer:users!tasks_customer_id_fkey(id, name, phone),
        bids(
          *,
          provider:users!bids_provider_id_fkey(id, name, phone),
          provider_profile:provider_profiles!bids_provider_id_fkey(rating, experience_years, completed_jobs)
        )
      `)
            .eq('id', taskId)
            .single();

        if (error || !task) {
            return sendError(res, 'Task not found', 404);
        }

        return sendSuccess(res, { task });
    } catch (error) {
        next(error);
    }
};

/**
 * Get tasks (filtered)
 * GET /api/tasks
 */
const getTasks = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('tasks')
            .select('*, customer:users!tasks_customer_id_fkey(id, name)', { count: 'exact' });

        // Role-based filtering
        if (req.user.role === 'customer') {
            query = query.eq('customer_id', req.user.id);
        }

        // Status filter
        if (status) {
            query = query.eq('status', status);
        }

        // Pagination
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        const { data: tasks, error, count } = await query;

        if (error) {
            logger.error('Failed to fetch tasks:', error);
            return sendError(res, 'Failed to fetch tasks', 500);
        }

        return sendPaginated(res, tasks, page, limit, count);
    } catch (error) {
        next(error);
    }
};

/**
 * Get nearby tasks (for providers)
 * GET /api/tasks/nearby
 */
const getNearbyTasks = async (req, res, next) => {
    try {
        if (req.user.role !== 'provider') {
            return sendError(res, 'Only providers can view nearby tasks', 403);
        }

        const { lat, lng, radius = 5 } = req.query;

        if (!lat || !lng) {
            return sendError(res, 'Location (lat, lng) is required', 400);
        }

        // Get all open tasks
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('status', 'open');

        if (error) {
            return sendError(res, 'Failed to fetch tasks', 500);
        }

        // Filter by distance
        const nearbyTasks = tasks
            .filter(task => {
                if (!task.location_lat || !task.location_lng) return false;
                const distance = calculateDistance(
                    parseFloat(lat),
                    parseFloat(lng),
                    task.location_lat,
                    task.location_lng
                );
                return distance <= parseFloat(radius);
            })
            .map(task => ({
                ...task,
                distance: calculateDistance(
                    parseFloat(lat),
                    parseFloat(lng),
                    task.location_lat,
                    task.location_lng
                ).toFixed(2)
            }))
            .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

        return sendSuccess(res, { tasks: nearbyTasks, count: nearbyTasks.length });
    } catch (error) {
        next(error);
    }
};

/**
 * Update task status
 * PATCH /api/tasks/:taskId/status
 */
const updateTaskStatus = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['open', 'bidding', 'assigned', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return sendError(res, 'Invalid status', 400);
        }

        // Update task
        const { data: task, error } = await supabase
            .from('tasks')
            .update({ status })
            .eq('id', taskId)
            .eq('customer_id', req.user.id)
            .select()
            .single();

        if (error || !task) {
            return sendError(res, 'Failed to update task or unauthorized', 400);
        }

        return sendSuccess(res, { task }, 'Task status updated');
    } catch (error) {
        next(error);
    }
};

/**
 * Delete task (cancel)
 * DELETE /api/tasks/:taskId
 */
const deleteTask = async (req, res, next) => {
    try {
        const { taskId } = req.params;

        // Check if task has accepted bids
        const { data: acceptedBids } = await supabase
            .from('bids')
            .select('id')
            .eq('task_id', taskId)
            .eq('status', 'accepted')
            .limit(1);

        if (acceptedBids && acceptedBids.length > 0) {
            return sendError(res, 'Cannot delete task with accepted bids', 400);
        }

        // Cancel task
        const { data: task, error } = await supabase
            .from('tasks')
            .update({ status: 'cancelled' })
            .eq('id', taskId)
            .eq('customer_id', req.user.id)
            .select()
            .single();

        if (error || !task) {
            return sendError(res, 'Failed to cancel task or unauthorized', 400);
        }

        return sendSuccess(res, null, 'Task cancelled successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTask,
    getTask,
    getTasks,
    getNearbyTasks,
    updateTaskStatus,
    deleteTask
};
