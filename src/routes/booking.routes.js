const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings
 * @access  Private
 */
router.get('/', authenticate, bookingController.getBookings);

/**
 * @route   GET /api/bookings/:bookingId
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:bookingId', authenticate, bookingController.getBooking);

/**
 * @route   PATCH /api/bookings/:bookingId/start
 * @desc    Start booking
 * @access  Private (Provider only)
 */
router.patch('/:bookingId/start', authenticate, requireRole('provider'), bookingController.startBooking);

/**
 * @route   PATCH /api/bookings/:bookingId/complete
 * @desc    Complete booking
 * @access  Private (Provider only)
 */
router.patch('/:bookingId/complete', authenticate, requireRole('provider'), bookingController.completeBooking);

/**
 * @route   PATCH /api/bookings/:bookingId/cancel
 * @desc    Cancel booking
 * @access  Private
 */
router.patch('/:bookingId/cancel', authenticate, bookingController.cancelBooking);

/**
 * @route   GET /api/bookings/:bookingId/timeline
 * @desc    Get booking timeline
 * @access  Private
 */
router.get('/:bookingId/timeline', authenticate, bookingController.getBookingTimeline);

module.exports = router;
