const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/ai/recommend-provider
 * @desc    Get AI-powered provider recommendation for a task
 * @access  Private
 */
router.post('/recommend-provider', authenticate, aiController.recommendProvider);

/**
 * @route   POST /api/ai/booking-confidence
 * @desc    Get booking confidence score for a bid
 * @access  Private
 */
router.post('/booking-confidence', authenticate, aiController.getBookingConfidence);

module.exports = router;
