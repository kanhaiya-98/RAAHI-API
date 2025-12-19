const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const { optionalAuth } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/search/tasks
 * @desc    Search tasks with filters
 * @access  Public/Private (optional auth)
 */
router.get('/tasks', optionalAuth, searchController.searchTasks);

/**
 * @route   GET /api/search/providers
 * @desc    Search providers with filters
 * @access  Public/Private (optional auth)
 */
router.get('/providers', optionalAuth, searchController.searchProviders);

/**
 * @route   GET /api/search/statistics/platform
 * @desc    Get platform statistics
 * @access  Public
 */
router.get('/statistics/platform', searchController.getPlatformStats);

/**
 * @route   GET /api/search/statistics/categories
 * @desc    Get category statistics
 * @access  Public
 */
router.get('/statistics/categories', searchController.getCategoryStats);

module.exports = router;
