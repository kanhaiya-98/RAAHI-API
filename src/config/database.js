const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    logger.error('Missing Supabase credentials in environment variables');
    throw new Error('Supabase configuration is incomplete');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Test database connection
 */
const testConnection = async () => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        if (error) {
            logger.error('Database connection test failed:', error);
            return false;
        }

        logger.info('Database connection successful');
        return true;
    } catch (error) {
        logger.error('Database connection error:', error);
        return false;
    }
};

module.exports = {
    supabase,
    testConnection
};
