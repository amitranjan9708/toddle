const express = require('express');
const AuthController = require('../controllers/authController');
const { validateLogin } = require('../middleware/validation');
const { catchAsync } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 * @body    { username: string, role: 'TUTOR' | 'STUDENT' }
 */
router.post('/login', validateLogin, catchAsync(AuthController.login));

module.exports = router;
