const db = require('../../models');
const { Budget, Category, Transaction } = db;
const { Op } = require('sequelize');
const NotificationService = require('./notification.service');

class BudgetService {
  static async createBudget(userId, budgetData) {
    const { category_id, amount, period, start_date, alert_threshold = 80 } = budgetData;

    const endDate = this.calculateEndDate(start_date, period);

    const existingBudget = await Budget.findOne({
      where: {
        user_id: userId,
        category_id,
        start_date: { [Op.lte]: endDate },
        end_date: { [Op.gte]: start_date },
        is_active: true
      }
    });

    if (existingBudget) {
      throw new Error('Budget for this category and period already exists');
    }

    return await Budget.create({
      user_id: userId,
      category_id,
      amount,
      period,
      start_date,
      end_date: endDate,
      alert_threshold,
      is_active: true
    });
  }

  static async getBudgets(userId, filters = {}) {
    const { category_id, period, is_active = true } = filters;

    const whereClause = { user_id: userId };

    if (category_id) whereClause.category_id = category_id;
    if (period) whereClause.period = period;
    if (is_active !== undefined) whereClause.is_active = is_active;

    return await Budget.findAll({
      where: whereClause,
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }],
      order: [['created_at', 'DESC']]
    });
  }

  static async getBudgetWithSpending(userId, budgetId) {
    const budget = await Budget.findOne({
      where: { id: budgetId, user_id: userId },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }]
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    const totalSpent = await Transaction.sum('amount', {
      where: {
        user_id: userId,
        category_id: budget.category_id,
        type: 'expense',
        transaction_date: {
          [Op.between]: [budget.start_date, budget.end_date]
        }
      }
    }) || 0;

    const spentPercentage = (totalSpent / budget.amount) * 100;
    const remaining = Math.max(0, budget.amount - totalSpent);

    return {
      ...budget.toJSON(),
      spending: {
        total_spent: parseFloat(totalSpent),
        remaining: parseFloat(remaining),
        spent_percentage: Math.round(spentPercentage * 100) / 100,
        is_over_budget: totalSpent > budget.amount,
        is_near_limit: spentPercentage >= budget.alert_threshold
      }
    };
  }

  static async checkBudgetAlerts(userId, categoryId, newTransactionAmount) {
    const currentDate = new Date();

    const activeBudgets = await Budget.findAll({
      where: {
        user_id: userId,
        category_id: categoryId,
        is_active: true,
        start_date: { [Op.lte]: currentDate },
        end_date: { [Op.gte]: currentDate }
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }]
    });

    const alerts = [];

    for (const budget of activeBudgets) {
      const totalSpent = await Transaction.sum('amount', {
        where: {
          user_id: userId,
          category_id: budget.category_id,
          type: 'expense',
          transaction_date: {
            [Op.between]: [budget.start_date, budget.end_date]
          }
        }
      }) || 0;

      const newTotal = totalSpent + newTransactionAmount;
      const newPercentage = (newTotal / budget.amount) * 100;
      const previousPercentage = (totalSpent / budget.amount) * 100;

      let shouldCreateNotification = false;
      let alertType = 'warning';

      if (newTotal > budget.amount && totalSpent <= budget.amount) {
        shouldCreateNotification = true;
        alertType = 'exceeded';
      } else if (newPercentage >= budget.alert_threshold && previousPercentage < budget.alert_threshold) {
        shouldCreateNotification = true;
        alertType = 'warning';
      }

      if (shouldCreateNotification) {
        try {
          await NotificationService.createBudgetAlert(
            userId,
            { budget, category: budget.category },
            newTotal,
            alertType
          );
        } catch (error) {
          console.error('Failed to create budget alert notification:', error);
        }
      }

      if (newPercentage >= budget.alert_threshold) {
        alerts.push({
          budget_id: budget.id,
          category_id: budget.category_id,
          category: budget.category,
          spent_percentage: Math.round(newPercentage * 100) / 100,
          is_over_budget: newTotal > budget.amount,
          message: newTotal > budget.amount
            ? 'Budget exceeded!'
            : `Budget alert: ${Math.round(newPercentage)}% spent`,
          notification_created: shouldCreateNotification
        });
      }
    }

    return alerts;
  }

  static async getBudgetDetail(userId, budgetId) {
    const budget = await Budget.findOne({
      where: {
        id: budgetId,
        user_id: userId
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color', 'type']
      }]
    });

    if (!budget) {
      return null;
    }

    // Calculate spending
    const totalSpent = await Transaction.sum('amount', {
      where: {
        user_id: userId,
        category_id: budget.category_id,
        type: 'expense',
        transaction_date: {
          [Op.between]: [budget.start_date, budget.end_date]
        }
      }
    }) || 0;

    const remaining = budget.amount - totalSpent;
    const spentPercentage = (totalSpent / budget.amount) * 100;

    return {
      ...budget.toJSON(),
      spending: {
        total_spent: totalSpent,
        remaining: Math.max(0, remaining),
        spent_percentage: Math.round(spentPercentage * 100) / 100,
        is_over_budget: totalSpent > budget.amount
      }
    };
  }

  static calculateEndDate(startDate, period) {
    const start = new Date(startDate);

    switch (period) {
      case 'weekly':
        return new Date(start.getTime() + (7 * 24 * 60 * 60 * 1000));
      case 'monthly':
        return new Date(start.getFullYear(), start.getMonth() + 1, start.getDate() - 1);
      case 'yearly':
        return new Date(start.getFullYear() + 1, start.getMonth(), start.getDate() - 1);
      default:
        throw new Error('Invalid period');
    }
  }
}

module.exports = BudgetService;
