const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const ValidationHelper = require('../src/utils/validation');
const { authAccess } = require('../middleware/auth.middleware');

// Public routes (no auth required)
router.post('/register', ValidationHelper.validateRegister, AuthController.register);
router.post('/login', ValidationHelper.validateLogin, AuthController.login);

// Protected routes
router.get('/me', authAccess, AuthController.me);
router.post('/refresh', ValidationHelper.validateRefreshToken, AuthController.refreshToken);
router.post('/logout', authAccess, AuthController.logout);

module.exports = router;
