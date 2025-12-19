const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bid.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/bids
 * @desc    Create a bid
 * @access  Private (Provider only)
 */
router.post('/', authenticate, requireRole('provider'), bidController.createBid);

/**
 * @route   GET /api/bids/task/:taskId
 * @desc    Get all bids for a task
 * @access  Private
 */
router.get('/task/:taskId', authenticate, bidController.getBidsForTask);

/**
 * @route   GET /api/bids/my-bids
 * @desc    Get provider's bids
 * @access  Private (Provider only)
 */
router.get('/my-bids', authenticate, requireRole('provider'), bidController.getMyBids);

/**
 * @route   POST /api/bids/:bidId/accept
 * @desc    Accept a bid
 * @access  Private (Customer only)
 */
router.post('/:bidId/accept', authenticate, requireRole('customer'), bidController.acceptBid);

/**
 * @route   POST /api/bids/:bidId/reject
 * @desc    Reject a bid
 * @access  Private (Customer only)
 */
router.post('/:bidId/reject', authenticate, requireRole('customer'), bidController.rejectBid);

/**
 * @route   DELETE /api/bids/:bidId
 * @desc    Withdraw a bid
 * @access  Private (Provider only)
 */
router.delete('/:bidId', authenticate, requireRole('provider'), bidController.withdrawBid);

module.exports = router;
