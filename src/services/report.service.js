const db = require('../../models');
const { Transaction, Category, Budget } = db;
const { Op } = require('sequelize');

class ReportService {
  static async getFinancialSummary(userId, period = 'month', year = null, month = null) {
    const dateRange = this.getDateRangeForPeriod(period, year, month);

    const whereClause = {
      user_id: userId,
      transaction_date: {
        [Op.between]: [dateRange.start, dateRange.end]
      }
    };

    const [income, expense, transactionCount, categoryBreakdown] = await Promise.all([
      this.getTotalByType(whereClause, 'income'),
      this.getTotalByType(whereClause, 'expense'),
      this.getTransactionCount(whereClause),
      this.getCategoryBreakdown(whereClause)
    ]);

    return {
      period,
      date_range: {
        start: dateRange.start,
        end: dateRange.end
      },
      summary: {
        total_income: parseFloat(income),
        total_expense: parseFloat(expense),
        net_balance: parseFloat(income - expense),
        transaction_count: transactionCount,
        avg_transaction: transactionCount > 0 ? parseFloat((income + expense) / transactionCount) : 0
      },
      breakdown: {
        income_by_category: categoryBreakdown.income,
        expense_by_category: categoryBreakdown.expense
      }
    };
  }

  static async getTrendAnalysis(userId, period = 'monthly', limit = 12) {
    const trends = [];
    const now = new Date();

    for (let i = limit - 1; i >= 0; i--) {
      let periodStart, periodEnd, label;

      if (period === 'monthly') {
        periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        label = periodStart.toLocaleDateString('id-ID', { year: 'numeric', month: 'short' });
      } else if (period === 'weekly') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
        periodStart = weekStart;
        periodEnd = new Date(weekStart);
        periodEnd.setDate(weekStart.getDate() + 6);
        label = `Week ${periodStart.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}`;
      }

      const whereClause = {
        user_id: userId,
        transaction_date: {
          [Op.between]: [periodStart, periodEnd]
        }
      };

      const [income, expense] = await Promise.all([
        this.getTotalByType(whereClause, 'income'),
        this.getTotalByType(whereClause, 'expense')
      ]);

      trends.push({
        period: label,
        date: periodStart.toISOString().split('T')[0],
        income: parseFloat(income),
        expense: parseFloat(expense),
        net: parseFloat(income - expense)
      });
    }

    return {
      period_type: period,
      trends,
      analysis: this.analyzeTrends(trends)
    };
  }

  static async getTopCategories(userId, type = 'expense', period = 'month', limit = 10) {
    const dateRange = this.getDateRangeForPeriod(period);

    const results = await Transaction.findAll({
      where: {
        user_id: userId,
        type,
        transaction_date: {
          [Op.between]: [dateRange.start, dateRange.end]
        }
      },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }],
      attributes: [
        'category_id',
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total'],
        [db.sequelize.fn('COUNT', db.sequelize.col('Transaction.id')), 'count'],
        [db.sequelize.fn('AVG', db.sequelize.col('amount')), 'average']
      ],
      group: ['category_id', 'category.id'],
      order: [[db.sequelize.fn('SUM', db.sequelize.col('amount')), 'DESC']],
      limit
    });

    const totalAmount = await this.getTotalByType({
      user_id: userId,
      type,
      transaction_date: { [Op.between]: [dateRange.start, dateRange.end] }
    });

    return results.map(item => ({
      category: item.category,
      total: parseFloat(item.dataValues.total),
      count: parseInt(item.dataValues.count),
      average: parseFloat(item.dataValues.average),
      percentage: totalAmount > 0 ? (item.dataValues.total / totalAmount * 100).toFixed(2) : 0
    }));
  }

  static async getBudgetProgress(userId) {
    const currentDate = new Date();

    const activeBudgets = await Budget.findAll({
      where: {
        user_id: userId,
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

    const budgetProgress = [];

    for (const budget of activeBudgets) {
      const spent = await Transaction.sum('amount', {
        where: {
          user_id: userId,
          category_id: budget.category_id,
          type: 'expense',
          transaction_date: {
            [Op.between]: [budget.start_date, budget.end_date]
          }
        }
      }) || 0;

      const spentPercentage = (spent / budget.amount) * 100;
      const remaining = Math.max(0, budget.amount - spent);
      const daysLeft = Math.ceil((new Date(budget.end_date) - currentDate) / (1000 * 60 * 60 * 24));

      budgetProgress.push({
        budget: {
          id: budget.id,
          amount: parseFloat(budget.amount),
          period: budget.period,
          alert_threshold: budget.alert_threshold
        },
        category: budget.category,
        progress: {
          spent: parseFloat(spent),
          remaining: parseFloat(remaining),
          percentage: Math.round(spentPercentage * 100) / 100,
          days_remaining: daysLeft,
          status: this.getBudgetStatus(spentPercentage, budget.alert_threshold),
          is_over_budget: spent > budget.amount
        }
      });
    }

    return budgetProgress.sort((a, b) => b.progress.percentage - a.progress.percentage);
  }

  static getDateRangeForPeriod(period, year = null, month = null) {
    const now = new Date();

    switch (period) {
      case 'week':
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6));
        return { start: startOfWeek, end: endOfWeek };

      case 'year':
        const targetYear = year || now.getFullYear();
        return {
          start: new Date(targetYear, 0, 1),
          end: new Date(targetYear, 11, 31)
        };

      case 'custom':
        if (year && month) {
          return {
            start: new Date(year, month - 1, 1),
            end: new Date(year, month, 0)
          };
        }
        // fallback to current month
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };

      default: // month
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
    }
  }

  static async getTotalByType(whereClause, type = null) {
    const condition = type ? { ...whereClause, type } : whereClause;
    return await Transaction.sum('amount', { where: condition }) || 0;
  }

  static async getTransactionCount(whereClause) {
    return await Transaction.count({ where: whereClause });
  }

  static async getCategoryBreakdown(whereClause) {
    const [incomeBreakdown, expenseBreakdown] = await Promise.all([
      this.getBreakdownByType(whereClause, 'income'),
      this.getBreakdownByType(whereClause, 'expense')
    ]);

    return {
      income: incomeBreakdown,
      expense: expenseBreakdown
    };
  }

  static async getBreakdownByType(whereClause, type) {
    const results = await Transaction.findAll({
      where: { ...whereClause, type },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }],
      attributes: [
        'category_id',
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total'],
        [db.sequelize.fn('COUNT', db.sequelize.col('Transaction.id')), 'count']
      ],
      group: ['category_id', 'category.id'],
      order: [[db.sequelize.fn('SUM', db.sequelize.col('amount')), 'DESC']]
    });

    return results.map(item => ({
      category: item.category,
      total: parseFloat(item.dataValues.total),
      count: parseInt(item.dataValues.count)
    }));
  }

  static analyzeTrends(trends) {
    if (trends.length < 2) return null;

    const currentPeriod = trends[trends.length - 1];
    const previousPeriod = trends[trends.length - 2];

    const incomeChange = this.calculatePercentageChange(previousPeriod.income, currentPeriod.income);
    const expenseChange = this.calculatePercentageChange(previousPeriod.expense, currentPeriod.expense);

    return {
      income_trend: {
        current: currentPeriod.income,
        previous: previousPeriod.income,
        change_percentage: incomeChange,
        direction: incomeChange > 0 ? 'up' : incomeChange < 0 ? 'down' : 'stable'
      },
      expense_trend: {
        current: currentPeriod.expense,
        previous: previousPeriod.expense,
        change_percentage: expenseChange,
        direction: expenseChange > 0 ? 'up' : expenseChange < 0 ? 'down' : 'stable'
      }
    };
  }

  static calculatePercentageChange(oldValue, newValue) {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue * 100).toFixed(2);
  }

  static getBudgetStatus(percentage, threshold) {
    if (percentage >= 100) return 'over_budget';
    if (percentage >= threshold) return 'warning';
    if (percentage >= 50) return 'on_track';
    return 'good';
  }
}

module.exports = ReportService;
