const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

/**
 * @route   POST /api/tasks
 * @desc    Create new task
 * @access  Private (Customer only)
 */
router.post('/', authenticate, requireRole('customer'), taskController.createTask);

/**
 * @route   GET /api/tasks/nearby
 * @desc    Get nearby tasks for providers
 * @access  Private (Provider only)
 */
router.get('/nearby', authenticate, requireRole('provider'), taskController.getNearbyTasks);

/**
 * @route   GET /api/tasks/:taskId
 * @desc    Get task by ID
 * @access  Private
 */
router.get('/:taskId', authenticate, taskController.getTask);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks (filtered by role)
 * @access  Private
 */
router.get('/', authenticate, taskController.getTasks);

/**
 * @route   PATCH /api/tasks/:taskId/status
 * @desc    Update task status
 * @access  Private (Customer only)
 */
router.patch('/:taskId/status', authenticate, requireRole('customer'), taskController.updateTaskStatus);

/**
 * @route   DELETE /api/tasks/:taskId
 * @desc    Cancel task
 * @access  Private (Customer only)
 */
router.delete('/:taskId', authenticate, requireRole('customer'), taskController.deleteTask);

module.exports = router;
