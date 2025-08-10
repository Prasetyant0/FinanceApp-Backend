const db = require('../../models');
const { Notification, Reminder, User } = db;
const { Op } = require('sequelize');

class NotificationService {
  static async createNotification(userId, notificationData) {
    const { title, message, type, priority = 'medium', metadata = null, expiresAt = null } = notificationData;

    return await Notification.create({
      user_id: userId,
      title,
      message,
      type,
      priority,
      metadata,
      expires_at: expiresAt
    });
  }

  static async getNotifications(userId, filters = {}) {
    const { is_read, type, limit = 20, offset = 0 } = filters;

    const whereClause = {
      user_id: userId,
      [Op.or]: [
        { expires_at: null },
        { expires_at: { [Op.gt]: new Date() } }
      ]
    };

    if (is_read !== undefined) whereClause.is_read = is_read;
    if (type) whereClause.type = type;

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      notifications,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: count > (parseInt(offset) + parseInt(limit))
      }
    };
  }

  static async markAsRead(userId, notificationIds) {
    const whereClause = {
      user_id: userId,
      id: Array.isArray(notificationIds) ? { [Op.in]: notificationIds } : notificationIds
    };

    const [updatedCount] = await Notification.update(
      { is_read: true },
      { where: whereClause }
    );

    return updatedCount;
  }

  static async markAllAsRead(userId) {
    const [updatedCount] = await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: userId,
          is_read: false
        }
      }
    );

    return updatedCount;
  }

  static async deleteNotification(userId, notificationId) {
    return await Notification.destroy({
      where: {
        id: notificationId,
        user_id: userId
      }
    });
  }

  static async getUnreadCount(userId) {
    return await Notification.count({
      where: {
        user_id: userId,
        is_read: false,
        [Op.or]: [
          { expires_at: null },
          { expires_at: { [Op.gt]: new Date() } }
        ]
      }
    });
  }

  // Budget Alert Notifications
  static async createBudgetAlert(userId, budgetData, spentAmount, alertType = 'warning') {
    const { budget, category } = budgetData;
    const percentage = ((spentAmount / budget.amount) * 100).toFixed(1);

    let title, message, priority, type;

    if (alertType === 'exceeded') {
      title = `Budget ${category.name} Terlampaui!`;
      message = `Anda sudah menghabiskan ${this.formatCurrency(spentAmount)} dari budget ${this.formatCurrency(budget.amount)} (${percentage}%)`;
      priority = 'urgent';
      type = 'budget_exceeded';
    } else {
      title = `Peringatan Budget ${category.name}`;
      message = `Anda sudah menghabiskan ${percentage}% dari budget ${category.name} (${this.formatCurrency(spentAmount)}/${this.formatCurrency(budget.amount)})`;
      priority = 'high';
      type = 'budget_alert';
    }

    return await this.createNotification(userId, {
      title,
      message,
      type,
      priority,
      metadata: {
        budget_id: budget.id,
        category_id: category.id,
        spent_amount: spentAmount,
        budget_amount: budget.amount,
        percentage: parseFloat(percentage)
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
  }

  // Achievement Notifications
  static async createAchievementNotification(userId, achievementData) {
    const { type, message, metadata } = achievementData;

    return await this.createNotification(userId, {
      title: '🎉 Pencapaian Baru!',
      message,
      type: 'goal_achieved',
      priority: 'medium',
      metadata,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
  }

  // System Notifications
  static async createSystemNotification(userId, title, message, metadata = null) {
    return await this.createNotification(userId, {
      title,
      message,
      type: 'system',
      priority: 'low',
      metadata
    });
  }

  static formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }
}

module.exports = NotificationService;
