const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authAccess } = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authAccess, authController.me);

module.exports = router;
