const express = require('express');
const AssignmentController = require('../controllers/assignmentController');
const { authenticateToken, authorizeTutor, authorizeStudent } = require('../middleware/auth');
const { 
    validateCreateAssignment,
    validateUpdateAssignment,
    validateDeleteAssignment,
    validateGetAssignment,
    validateAssignmentFeed,
    validateSubmission
} = require('../middleware/validation');
const { catchAsync } = require('../middleware/errorHandler');

const router = express.Router();

// All assignment routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/assignments
 * @desc    Create a new assignment (Tutor only)
 * @access  Private (Tutor)
 * @body    { description: string, studentIds?: number[], publishedAt?: string, deadline?: string }
 */
router.post('/', authorizeTutor, validateCreateAssignment, catchAsync(AssignmentController.create));

/**
 * @route   GET /api/assignments/feed
 * @desc    Get assignment feed with filters
 * @access  Private
 * @query   { publishedAt?: 'SCHEDULED' | 'ONGOING', status?: 'ALL' | 'PENDING' | 'OVERDUE' | 'SUBMITTED', page?: number, limit?: number }
 */
router.get('/feed', validateAssignmentFeed, catchAsync(AssignmentController.getFeed));

/**
 * @route   GET /api/assignments/:id
 * @desc    Get assignment details
 * @access  Private
 * @params  { id: number }
 */
router.get('/:id', validateGetAssignment, catchAsync(AssignmentController.getDetails));

/**
 * @route   PUT /api/assignments/:id
 * @desc    Update assignment (Tutor only)
 * @access  Private (Tutor)
 * @params  { id: number }
 * @body    { description?: string, studentIds?: number[], publishedAt?: string, deadline?: string }
 */
router.put('/:id', authorizeTutor, validateUpdateAssignment, catchAsync(AssignmentController.update));

/**
 * @route   DELETE /api/assignments/:id
 * @desc    Delete assignment (Tutor only)
 * @access  Private (Tutor)
 * @params  { id: number }
 */
router.delete('/:id', authorizeTutor, validateDeleteAssignment, catchAsync(AssignmentController.delete));

/**
 * @route   POST /api/assignments/submit
 * @desc    Submit assignment (Student only)
 * @access  Private (Student)
 * @body    { assignmentId: number, remark: string }
 */
router.post('/submit', authorizeStudent, validateSubmission, catchAsync(AssignmentController.submit));

/**
 * @route   POST /api/assignments/grade
 * @desc    Grade assignment (Tutor only)
 * @access  Private (Tutor)
 * @body    { assignmentId: number, studentId: number, grade: string, feedback?: string }
 */
router.post('/grade', authorizeTutor, catchAsync(AssignmentController.grade));

module.exports = router;
