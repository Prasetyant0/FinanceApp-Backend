const db = require('../../models');
const { Reminder, Notification } = db;
const { Op } = require('sequelize');
const NotificationService = require('./notification.service');

class ReminderService {
  static async createReminder(userId, reminderData) {
    const {
      title,
      description,
      reminder_type,
      frequency = 'once',
      remind_at,
      metadata = null
    } = reminderData;

    const nextReminder = frequency !== 'once' ? this.calculateNextReminder(remind_at, frequency) : null;

    return await Reminder.create({
      user_id: userId,
      title,
      description,
      reminder_type,
      frequency,
      remind_at: new Date(remind_at),
      next_reminder: nextReminder,
      metadata
    });
  }

  static async getReminders(userId, filters = {}) {
    const { reminder_type, is_active = true, limit = 20 } = filters;

    const whereClause = { user_id: userId };
    if (reminder_type) whereClause.reminder_type = reminder_type;
    if (is_active !== undefined) whereClause.is_active = is_active;

    return await Reminder.findAll({
      where: whereClause,
      order: [['next_reminder', 'ASC'], ['remind_at', 'ASC']],
      limit: parseInt(limit)
    });
  }

  static async updateReminder(userId, reminderId, updateData) {
    const reminder = await Reminder.findOne({
      where: { id: reminderId, user_id: userId }
    });

    if (!reminder) {
      throw new Error('Reminder not found');
    }

    if (updateData.frequency || updateData.remind_at) {
      const frequency = updateData.frequency || reminder.frequency;
      const remindAt = updateData.remind_at || reminder.remind_at;

      updateData.next_reminder = frequency !== 'once' ?
        this.calculateNextReminder(remindAt, frequency) : null;
    }

    return await reminder.update(updateData);
  }

  static async deleteReminder(userId, reminderId) {
    return await Reminder.destroy({
      where: {
        id: reminderId,
        user_id: userId
      }
    });
  }

  static async toggleReminder(userId, reminderId) {
    const reminder = await Reminder.findOne({
      where: { id: reminderId, user_id: userId }
    });

    if (!reminder) {
      throw new Error('Reminder not found');
    }

    return await reminder.update({ is_active: !reminder.is_active });
  }

  static async processDueReminders() {
    const now = new Date();

    const dueReminders = await Reminder.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          {
            frequency: 'once',
            remind_at: { [Op.lte]: now }
          },
          {
            frequency: { [Op.ne]: 'once' },
            next_reminder: { [Op.lte]: now }
          }
        ]
      }
    });

    const processedCount = { total: 0, success: 0, failed: 0 };

    for (const reminder of dueReminders) {
      processedCount.total++;

      try {
        await NotificationService.createNotification(reminder.user_id, {
          title: `⏰ ${reminder.title}`,
          message: reminder.description || `Reminder: ${reminder.title}`,
          type: 'reminder',
          priority: 'medium',
          metadata: {
            reminder_id: reminder.id,
            reminder_type: reminder.reminder_type,
            ...reminder.metadata
          }
        });

        if (reminder.frequency === 'once') {
          await reminder.update({ is_active: false });
        } else {
          const nextReminder = this.calculateNextReminder(reminder.next_reminder, reminder.frequency);
          await reminder.update({ next_reminder: nextReminder });
        }

        processedCount.success++;
      } catch (error) {
        console.error(`Failed to process reminder ${reminder.id}:`, error);
        processedCount.failed++;
      }
    }

    return processedCount;
  }

  static async createBudgetCheckReminders() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const usersWithBudgets = await db.sequelize.query(`
      SELECT DISTINCT b.user_id, u.name as user_name
      FROM budgets b
      JOIN users u ON b.user_id = u.id
      WHERE b.is_active = true
      AND b.start_date <= :today
      AND b.end_date >= :today
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = b.user_id
        AND n.type = 'budget_alert'
        AND DATE(n.created_at) = DATE(:today)
      )
    `, {
      replacements: { today },
      type: db.sequelize.QueryTypes.SELECT
    });

    let createdReminders = 0;

    for (const user of usersWithBudgets) {
      try {
        await NotificationService.createSystemNotification(
          user.user_id,
          '📊 Budget Check Reminder',
          'Jangan lupa untuk mengecek progress budget Anda hari ini!',
          { reminder_type: 'budget_check' }
        );
        createdReminders++;
      } catch (error) {
        console.error(`Failed to create budget reminder for user ${user.user_id}:`, error);
      }
    }

    return createdReminders;
  }

  static calculateNextReminder(currentDate, frequency) {
    const date = new Date(currentDate);

    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      default:
        return null;
    }

    return date;
  }

  // Quick reminder templates
  static getQuickReminderTemplates() {
    return [
      {
        title: 'Cek Budget Bulanan',
        reminder_type: 'budget_check',
        frequency: 'monthly',
        description: 'Waktu untuk mengecek progress budget bulan ini'
      },
      {
        title: 'Bayar Tagihan Listrik',
        reminder_type: 'bill_payment',
        frequency: 'monthly',
        description: 'Jangan lupa bayar tagihan listrik'
      },
      {
        title: 'Transfer Tabungan',
        reminder_type: 'recurring_transaction',
        frequency: 'monthly',
        description: 'Transfer ke rekening tabungan'
      },
      {
        title: 'Review Pengeluaran Mingguan',
        reminder_type: 'budget_check',
        frequency: 'weekly',
        description: 'Tinjau pengeluaran minggu ini'
      }
    ];
  }
}

module.exports = ReminderService;
