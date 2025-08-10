const NotificationService = require('../src/services/notification.service');
const ResponseHelper = require('../src/utils/response');
const { HTTP_STATUS, RESPONSE_MESSAGES } = require('../src/constants/response');

class NotificationController {
  static async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const filters = {
        is_read: req.query.is_read,
        type: req.query.type,
        limit: req.query.limit || 20,
        offset: req.query.offset || 0
      };

      const result = await NotificationService.getNotifications(userId, filters);

      return ResponseHelper.success(
        res,
        result,
        'Notifications retrieved successfully'
      );
    } catch (error) {
      console.error('Get notifications error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { notification_ids } = req.body;

      if (!notification_ids || !Array.isArray(notification_ids)) {
        return ResponseHelper.error(
          res,
          'notification_ids array is required',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const updatedCount = await NotificationService.markAsRead(userId, notification_ids);

      return ResponseHelper.success(
        res,
        { updated_count: updatedCount },
        `${updatedCount} notification(s) marked as read`
      );
    } catch (error) {
      console.error('Mark notifications as read error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      const updatedCount = await NotificationService.markAllAsRead(userId);

      return ResponseHelper.success(
        res,
        { updated_count: updatedCount },
        `${updatedCount} notification(s) marked as read`
      );
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async deleteNotification(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const deleted = await NotificationService.deleteNotification(userId, id);

      if (!deleted) {
        return ResponseHelper.error(
          res,
          RESPONSE_MESSAGES.ERROR.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      return ResponseHelper.success(
        res,
        null,
        RESPONSE_MESSAGES.SUCCESS.DELETED
      );
    } catch (error) {
      console.error('Delete notification error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await NotificationService.getUnreadCount(userId);

      return ResponseHelper.success(
        res,
        { unread_count: count },
        'Unread count retrieved successfully'
      );
    } catch (error) {
      console.error('Get unread count error:', error);
      return ResponseHelper.error(res);
    }
  }
}

module.exports = NotificationController;
