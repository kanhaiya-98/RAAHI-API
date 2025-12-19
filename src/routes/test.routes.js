const express = require('express');
const router = express.Router();
const taskClassificationService = require('../services/taskClassification.service');
const priceEstimationService = require('../services/priceEstimation.service');
const bidAnalysisService = require('../services/bidAnalysis.service');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Test AI task classification
 * POST /api/test/ai-classification
 */
router.post('/ai-classification', async (req, res, next) => {
    try {
        const { task_description, location = 'Mumbai' } = req.body;

        if (!task_description) {
            return sendError(res, 'task_description is required', 400);
        }

        const classification = await taskClassificationService.classifyTask(
            task_description,
            location
        );

        return sendSuccess(res, { classification }, 'AI classification test');
    } catch (error) {
        next(error);
    }
});

/**
 * Test AI price estimation
 * POST /api/test/ai-pricing
 */
router.post('/ai-pricing', async (req, res, next) => {
    try {
        const {
            service_category = 'Plumbing',
            complexity = 'Medium',
            issue_type = 'General service',
            location = 'Mumbai'
        } = req.body;

        const estimation = await priceEstimationService.estimatePrice(
            service_category,
            complexity,
            issue_type,
            location
        );

        return sendSuccess(res, { estimation }, 'AI pricing test');
    } catch (error) {
        next(error);
    }
});

/**
 * Test AI bid analysis
 * POST /api/test/ai-bid-analysis
 */
router.post('/ai-bid-analysis', async (req, res, next) => {
    try {
        const { bids, price_estimate, customer_priority = 'best_value' } = req.body;

        if (!bids || !price_estimate) {
            return sendError(res, 'bids and price_estimate are required', 400);
        }

        const analysis = await bidAnalysisService.analyzeBids(
            'test-task-id',
            bids,
            price_estimate,
            customer_priority
        );

        return sendSuccess(res, { analysis }, 'AI bid analysis test');
    } catch (error) {
        next(error);
    }
});

/**
 * Test database connection
 * GET /api/test/db
 */
router.get('/db', async (req, res, next) => {
    try {
        const { testConnection } = require('../config/database');
        const isConnected = await testConnection();

        return sendSuccess(res, {
            database: isConnected ? 'connected' : 'disconnected'
        }, 'Database connection test');
    } catch (error) {
        next(error);
    }
});

/**
 * Test Gemini API
 * GET /api/test/gemini
 */
router.get('/gemini', async (req, res, next) => {
    try {
        const { testConnection } = require('../config/gemini');
        const isConnected = await testConnection();

        return sendSuccess(res, {
            gemini: isConnected ? 'connected' : 'disconnected'
        }, 'Gemini API connection test');
    } catch (error) {
        next(error);
    }
});

module.exports = router;
