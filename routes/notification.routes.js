const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const ValidationHelper = require('../src/utils/validation');
const { authAccess } = require('../middleware/auth.middleware');

router.use(authAccess);

router.get('/', NotificationController.getNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/mark-read', NotificationController.markAsRead);
router.patch('/mark-all-read', NotificationController.markAllAsRead);
router.delete('/:id', NotificationController.deleteNotification);

module.exports = router;
