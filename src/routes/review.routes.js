const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/reviews
 * @desc    Create review
 * @access  Private (Customer only)
 */
router.post('/', authenticate, requireRole('customer'), reviewController.createReview);

/**
 * @route   GET /api/reviews/provider/:providerId
 * @desc    Get reviews for provider
 * @access  Private
 */
router.get('/provider/:providerId', authenticate, reviewController.getProviderReviews);

/**
 * @route   GET /api/reviews/booking/:bookingId
 * @desc    Get review for booking
 * @access  Private
 */
router.get('/booking/:bookingId', authenticate, reviewController.getBookingReview);

/**
 * @route   DELETE /api/reviews/:reviewId
 * @desc    Delete review
 * @access  Private (Customer only)
 */
router.delete('/:reviewId', authenticate, requireRole('customer'), reviewController.deleteReview);

module.exports = router;
