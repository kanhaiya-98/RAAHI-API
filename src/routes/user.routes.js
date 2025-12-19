const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * @route   PATCH /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch('/profile', authenticate, userController.updateProfile);

/**
 * @route   POST /api/users/provider-profile
 * @desc    Create/update provider profile
 * @access  Private (Provider only)
 */
router.post('/provider-profile', authenticate, requireRole('provider'), userController.createProviderProfile);

/**
 * @route   GET /api/users/providers/nearby
 * @desc    Get nearby providers
 * @access  Private
 */
router.get('/providers/nearby', authenticate, userController.getNearbyProviders);

/**
 * @route   GET /api/users/providers/:providerId
 * @desc    Get provider public profile
 * @access  Private
 */
router.get('/providers/:providerId', authenticate, userController.getProvider);

/**
 * @route   PATCH /api/users/location
 * @desc    Update user location
 * @access  Private
 */
router.patch('/location', authenticate, userController.updateLocation);

/**
 * @route   GET /api/users/stats
 * @desc    Get provider stats
 * @access  Private (Provider only)
 */
router.get('/stats', authenticate, requireRole('provider'), userController.getProviderStats);

module.exports = router;
