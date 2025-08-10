const ReminderService = require('../src/services/reminder.service');
const ResponseHelper = require('../src/utils/response');
const { HTTP_STATUS, RESPONSE_MESSAGES } = require('../src/constants/response');

class ReminderController {
  static async createReminder(req, res) {
    try {
      const userId = req.user.id;
      const reminder = await ReminderService.createReminder(userId, req.body);

      return ResponseHelper.success(
        res,
        reminder,
        RESPONSE_MESSAGES.SUCCESS.CREATED,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      console.error('Create reminder error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async getReminders(req, res) {
    try {
      const userId = req.user.id;
      const reminders = await ReminderService.getReminders(userId, req.query);

      return ResponseHelper.success(
        res,
        reminders,
        'Reminders retrieved successfully'
      );
    } catch (error) {
      console.error('Get reminders error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async updateReminder(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const updatedReminder = await ReminderService.updateReminder(userId, id, req.body);

      return ResponseHelper.success(
        res,
        updatedReminder,
        RESPONSE_MESSAGES.SUCCESS.UPDATED
      );
    } catch (error) {
      console.error('Update reminder error:', error);

      if (error.message === 'Reminder not found') {
        return ResponseHelper.error(
          res,
          RESPONSE_MESSAGES.ERROR.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      return ResponseHelper.error(res);
    }
  }

  static async deleteReminder(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const deleted = await ReminderService.deleteReminder(userId, id);

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
      console.error('Delete reminder error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async toggleReminder(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const reminder = await ReminderService.toggleReminder(userId, id);

      return ResponseHelper.success(
        res,
        reminder,
        `Reminder ${reminder.is_active ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      console.error('Toggle reminder error:', error);

      if (error.message === 'Reminder not found') {
        return ResponseHelper.error(
          res,
          RESPONSE_MESSAGES.ERROR.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      return ResponseHelper.error(res);
    }
  }

  static async getQuickTemplates(req, res) {
    try {
      const templates = ReminderService.getQuickReminderTemplates();

      return ResponseHelper.success(
        res,
        templates,
        'Quick reminder templates retrieved successfully'
      );
    } catch (error) {
      console.error('Get quick templates error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async processDueReminders(req, res) {
    try {
      // Endpoint untuk pengujian manual
      // Di production, ini harus dipanggil by a scheduled job
      const result = await ReminderService.processDueReminders();

      return ResponseHelper.success(
        res,
        result,
        'Due reminders processed successfully'
      );
    } catch (error) {
      console.error('Process due reminders error:', error);
      return ResponseHelper.error(res);
    }
  }
}

module.exports = ReminderController;
