const db = require('../models');
const { Transaction, Category } = db;
const { Op } = require('sequelize');
const BudgetService = require('../src/services/budget.service');
const ResponseHelper = require('../src/utils/response');
const { HTTP_STATUS, RESPONSE_MESSAGES } = require('../src/constants/response');

class TransactionController {
  static async getTransactions(req, res) {
    try {
      const userId = req.user.id;
      const filters = TransactionController.parseFilters(req.query);
      const pagination = TransactionController.parsePagination(req.query);

      const whereClause = TransactionController.buildWhereClause(userId, filters);

      const { count, rows: transactions } = await Transaction.findAndCountAll({
        where: whereClause,
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        }],
        order: [['transaction_date', 'DESC']],
        limit: pagination.limit,
        offset: pagination.offset
      });

      const paginationData = TransactionController.buildPaginationResponse(
        pagination,
        count
      );

      return ResponseHelper.paginated(
        res,
        { transactions },
        paginationData
      );
    } catch (error) {
      console.error('Get transactions error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async createTransaction(req, res) {
    try {
      const userId = req.user.id;
      const transactionData = req.body;

      const category = await TransactionController.validateCategory(
        transactionData.category_id,
        transactionData.type
      );

      if (!category.isValid) {
        return ResponseHelper.error(
          res,
          category.message,
          category.status
        );
      }

      const transaction = await TransactionController.createTransactionRecord(
        userId,
        transactionData
      );

      let budgetAlerts = [];
      if (transactionData.type === 'expense') {
        budgetAlerts = await BudgetService.checkBudgetAlerts(
          userId,
          transactionData.category_id,
          transactionData.amount
        );
      }

      const newTransaction = await Transaction.findByPk(transaction.id, {
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        }]
      });

      const responseData = {
        transaction: newTransaction,
        budget_alerts: budgetAlerts
      };

      return ResponseHelper.success(
        res,
        responseData,
        RESPONSE_MESSAGES.SUCCESS.CREATED,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      console.error('Create transaction error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async updateTransaction(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const updateData = req.body;

      const transaction = await Transaction.findOne({
        where: { id, user_id: userId }
      });

      if (!transaction) {
        return ResponseHelper.error(
          res,
          RESPONSE_MESSAGES.ERROR.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      if (updateData.category_id && updateData.type) {
        const validation = await TransactionController.validateCategory(
          updateData.category_id,
          updateData.type
        );

        if (!validation.isValid) {
          return ResponseHelper.error(
            res,
            validation.message,
            validation.status
          );
        }
      }

      const updatedTransaction = await transaction.update(updateData);

      const result = await Transaction.findByPk(updatedTransaction.id, {
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        }]
      });

      return ResponseHelper.success(
        res,
        result,
        RESPONSE_MESSAGES.SUCCESS.UPDATED
      );
    } catch (error) {
      console.error('Update transaction error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async deleteTransaction(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const deleted = await Transaction.destroy({
        where: { id, user_id: userId }
      });

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
      console.error('Delete transaction error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async getDashboardStats(req, res) {
    try {
      const userId = req.user.id;
      const { period = 'month' } = req.query;

      const dateRange = TransactionController.getDateRange(period);
      const whereClause = {
        user_id: userId,
        transaction_date: {
          [Op.between]: [dateRange.start, dateRange.end]
        }
      };

      const [income, expense, recentTransactions, expensesByCategory] = await Promise.all([
        TransactionController.getTotalByType(whereClause, 'income'),
        TransactionController.getTotalByType(whereClause, 'expense'),
        TransactionController.getRecentTransactions(userId),
        TransactionController.getExpensesByCategory(whereClause)
      ]);

      const responseData = {
        period,
        summary: {
          income: parseFloat(income),
          expense: parseFloat(expense),
          balance: parseFloat(income - expense)
        },
        recentTransactions,
        expensesByCategory
      };

      return ResponseHelper.success(
        res,
        responseData,
        'Dashboard stats retrieved successfully'
      );
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async getTransactionDetail(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const transaction = await Transaction.findOne({
        where: { id, user_id: userId },
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        }]
      });

      if (!transaction) {
        return ResponseHelper.error(
          res,
          RESPONSE_MESSAGES.ERROR.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      return ResponseHelper.success(res, transaction);
    } catch (error) {
      console.error('Get transaction detail error:', error);
      return ResponseHelper.error(res);
    }
  }

  // Helper methods
  static parseFilters(query) {
    return {
      type: query.type,
      category_id: query.category_id,
      start_date: query.start_date,
      end_date: query.end_date
    };
  }

  static parsePagination(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    return {
      page,
      limit,
      offset: (page - 1) * limit
    };
  }

  static buildWhereClause(userId, filters) {
    const whereClause = { user_id: userId };

    if (filters.type && ['income', 'expense'].includes(filters.type)) {
      whereClause.type = filters.type;
    }

    if (filters.category_id) {
      whereClause.category_id = filters.category_id;
    }

    if (filters.start_date && filters.end_date) {
      whereClause.transaction_date = {
        [Op.between]: [filters.start_date, filters.end_date]
      };
    }

    return whereClause;
  }

  static buildPaginationResponse(pagination, totalItems) {
    return {
      currentPage: pagination.page,
      totalPages: Math.ceil(totalItems / pagination.limit),
      totalItems,
      limit: pagination.limit
    };
  }

  static async validateCategory(categoryId, type) {
    const category = await Category.findByPk(categoryId);

    if (!category) {
      return {
        isValid: false,
        message: 'Category not found',
        status: HTTP_STATUS.NOT_FOUND
      };
    }

    if (category.type !== type) {
      return {
        isValid: false,
        message: `Category type (${category.type}) doesn't match transaction type (${type})`,
        status: HTTP_STATUS.BAD_REQUEST
      };
    }

    return { isValid: true, category };
  }

  static async createTransactionRecord(userId, data) {
    return await Transaction.create({
      user_id: userId,
      category_id: data.category_id,
      type: data.type,
      amount: data.amount,
      description: data.description || null,
      transaction_date: data.transaction_date || new Date()
    });
  }

  static getDateRange(period) {
    const now = new Date();

    switch (period) {
      case 'week':
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6));
        return { start: startOfWeek, end: endOfWeek };

      case 'year':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31)
        };

      default: // month
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
    }
  }

  static async getTotalByType(whereClause, type) {
    return await Transaction.sum('amount', {
      where: { ...whereClause, type }
    }) || 0;
  }

  static async getRecentTransactions(userId) {
    return await Transaction.findAll({
      where: { user_id: userId },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }],
      order: [['transaction_date', 'DESC']],
      limit: 5
    });
  }

  static async getExpensesByCategory(whereClause) {
    const results = await Transaction.findAll({
      where: { ...whereClause, type: 'expense' },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'icon', 'color']
      }],
      attributes: [
        'category_id',
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total']
      ],
      group: ['category_id', 'category.id'],
      order: [[db.sequelize.fn('SUM', db.sequelize.col('amount')), 'DESC']]
    });

    return results.map(item => ({
      category: item.category,
      total: parseFloat(item.dataValues.total)
    }));
  }
}

// Export methods untuk backward compatibility
module.exports = {
  getTransactions: TransactionController.getTransactions,
  getTransactionDetail: TransactionController.getTransactionDetail,
  createTransaction: TransactionController.createTransaction,
  updateTransaction: TransactionController.updateTransaction,
  deleteTransaction: TransactionController.deleteTransaction,
  getDashboardStats: TransactionController.getDashboardStats
};
