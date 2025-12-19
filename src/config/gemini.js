const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    logger.error('Missing Gemini API key in environment variables');
    throw new Error('Gemini API key is not configured');
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Get Gemini model instance
 * @param {string} modelName - Model name (default: gemini-2.5-flash-lite)
 */
const getModel = (modelName = 'gemini-2.5-flash-lite') => {
    try {
        return genAI.getGenerativeModel({ model: modelName });
    } catch (error) {
        logger.error('Failed to initialize Gemini model:', error);
        throw error;
    }
};

/**
 * Test Gemini API connection
 */
const testConnection = async () => {
    try {
        const model = getModel();
        const result = await model.generateContent('Hello');
        const response = await result.response;
        const text = response.text();

        if (text) {
            logger.info('Gemini API connection successful');
            return true;
        }
        return false;
    } catch (error) {
        logger.error('Gemini API connection test failed:', error);
        return false;
    }
};

module.exports = {
    genAI,
    getModel,
    testConnection
};
