const { supabase } = require('../config/database');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Search tasks
 * GET /api/search/tasks
 */
const searchTasks = async (req, res, next) => {
    try {
        const {
            service_category,
            complexity,
            status,
            lat,
            lng,
            radius = 10,
            min_price,
            max_price,
            urgency,
            page = 1,
            limit = 20
        } = req.query;

        const offset = (page - 1) * limit;

        let query = supabase
            .from('tasks')
            .select('*', { count: 'exact' });

        // Filters
        if (service_category) {
            query = query.eq('ai_service_category', service_category);
        }
        if (complexity) {
            query = query.eq('ai_complexity', complexity);
        }
        if (status) {
            query = query.eq('status', status);
        }
        if (urgency) {
            query = query.eq('ai_urgency', urgency);
        }
        if (min_price) {
            query = query.gte('ai_price_min', parseInt(min_price));
        }
        if (max_price) {
            query = query.lte('ai_price_max', parseInt(max_price));
        }

        const { data: tasks, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (error) {
            return sendError(res, 'Failed to search tasks', 500);
        }

        // Filter by location if provided
        let filteredTasks = tasks;
        if (lat && lng) {
            filteredTasks = tasks.filter(task => {
                if (!task.location_lat || !task.location_lng) return false;
                const distance = calculateDistance(
                    parseFloat(lat),
                    parseFloat(lng),
                    task.location_lat,
                    task.location_lng
                );
                return distance <= parseFloat(radius);
            });
        }

        return sendPaginated(res, filteredTasks, page, limit, filteredTasks.length);
    } catch (error) {
        next(error);
    }
};

/**
 * Search providers
 * GET /api/search/providers
 */
const searchProviders = async (req, res, next) => {
    try {
        const {
            service_category,
            min_rating = 0,
            min_experience = 0,
            lat,
            lng,
            radius = 10,
            page = 1,
            limit = 20
        } = req.query;

        const offset = (page - 1) * limit;

        let query = supabase
            .from('provider_profiles')
            .select('*, user:users!provider_profiles_user_id_fkey(*)', { count: 'exact' })
            .eq('verification_status', 'verified')
            .gte('rating', parseFloat(min_rating))
            .gte('experience_years', parseInt(min_experience));

        if (service_category) {
            query = query.contains('service_categories', [service_category]);
        }

        const { data: providers, error, count } = await query
            .order('rating', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (error) {
            return sendError(res, 'Failed to search providers', 500);
        }

        // Filter by location and add distance
        let results = providers.map(p => ({
            id: p.user.id,
            name: p.user.name,
            service_categories: p.service_categories,
            rating: p.rating,
            experience_years: p.experience_years,
            completed_jobs: p.completed_jobs,
            bio: p.bio,
            distance: lat && lng && p.user.location_lat && p.user.location_lng
                ? calculateDistance(
                    parseFloat(lat),
                    parseFloat(lng),
                    p.user.location_lat,
                    p.user.location_lng
                ).toFixed(2)
                : null
        }));

        // Filter by radius if location provided
        if (lat && lng && radius) {
            results = results.filter(p => p.distance !== null && parseFloat(p.distance) <= parseFloat(radius));
        }

        return sendPaginated(res, results, page, limit, results.length);
    } catch (error) {
        next(error);
    }
};

/**
 * Get platform statistics
 * GET /api/search/statistics/platform
 */
const getPlatformStats = async (req, res, next) => {
    try {
        // Get task counts
        const { count: totalTasks } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true });

        const { count: activeTasks } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .in('status', ['open', 'bidding', 'assigned', 'in_progress']);

        // Get provider counts
        const { count: totalProviders } = await supabase
            .from('provider_profiles')
            .select('*', { count: 'exact', head: true });

        const { count: verifiedProviders } = await supabase
            .from('provider_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('verification_status', 'verified');

        // Get booking count
        const { count: totalBookings } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true });

        // Get average rating
        const { data: ratings } = await supabase
            .from('provider_profiles')
            .select('rating')
            .gt('rating', 0);

        const averageRating = ratings && ratings.length > 0
            ? (ratings.reduce((sum, p) => sum + p.rating, 0) / ratings.length).toFixed(2)
            : 0;

        return sendSuccess(res, {
            statistics: {
                total_tasks: totalTasks || 0,
                active_tasks: activeTasks || 0,
                total_providers: totalProviders || 0,
                verified_providers: verifiedProviders || 0,
                total_bookings: totalBookings || 0,
                average_rating: parseFloat(averageRating)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get service category statistics
 * GET /api/search/statistics/categories
 */
const getCategoryStats = async (req, res, next) => {
    try {
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('ai_service_category');

        if (error) {
            return sendError(res, 'Failed to fetch statistics', 500);
        }

        // Count by category
        const categoryCount = tasks.reduce((acc, task) => {
            const category = task.ai_service_category || 'Unknown';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {});

        // Sort by count
        const sorted = Object.entries(categoryCount)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);

        return sendSuccess(res, {
            categories: sorted,
            total_tasks: tasks.length
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Helper: Calculate distance between coordinates
 */
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

module.exports = {
    searchTasks,
    searchProviders,
    getPlatformStats,
    getCategoryStats
};
