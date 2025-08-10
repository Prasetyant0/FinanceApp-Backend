const db = require('../models');
const { Budget } = db;
const BudgetService = require('../src/services/budget.service');
const ResponseHelper = require('../src/utils/response');
const { HTTP_STATUS, RESPONSE_MESSAGES } = require('../src/constants/response');

class BudgetController {
  static async createBudget(req, res) {
    try {
      const userId = req.user.id;
      const budget = await BudgetService.createBudget(userId, req.body);

      const formattedBudget = {
        ...budget.toJSON(),
        amount: parseFloat(budget.amount).toFixed(2)
      };

      return ResponseHelper.success(
        res,
        formattedBudget,
        RESPONSE_MESSAGES.SUCCESS.CREATED,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      console.error('Create budget error:', error);

      if (error.message.includes('already exists')) {
        return ResponseHelper.error(
          res,
          error.message,
          HTTP_STATUS.CONFLICT
        );
      }

      return ResponseHelper.error(res);
    }
  }

  static async getBudgets(req, res) {
    try {
      const userId = req.user.id;
      const budgets = await BudgetService.getBudgets(userId, req.query);

      const formattedBudgets = budgets.map(budget => ({
        ...budget.toJSON(),
        amount: parseFloat(budget.amount).toFixed(2)
      }));

      return ResponseHelper.success(
        res,
        formattedBudgets,
        'Budgets retrieved successfully'
      );
    } catch (error) {
      console.error('Get budgets error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async getBudgetDetail(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const budgetDetail = await BudgetService.getBudgetDetail(userId, id);

      if (!budgetDetail) {
        return ResponseHelper.error(
          res,
          RESPONSE_MESSAGES.ERROR.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      // Format response untuk konsistensi
      const formattedDetail = {
        ...budgetDetail,
        amount: parseFloat(budgetDetail.amount).toFixed(2),
        spending: budgetDetail.spending ? {
          ...budgetDetail.spending,
          total_spent: parseFloat(budgetDetail.spending.total_spent).toFixed(2),
          remaining: parseFloat(budgetDetail.spending.remaining).toFixed(2)
        } : null
      };

      return ResponseHelper.success(
        res,
        formattedDetail,
        'Budget detail retrieved successfully'
      );
    } catch (error) {
      console.error('Get budget detail error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async updateBudget(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const budget = await Budget.findOne({
        where: { id, user_id: userId }
      });

      if (!budget) {
        return ResponseHelper.error(
          res,
          RESPONSE_MESSAGES.ERROR.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      const updatedBudget = await budget.update(req.body);

      return ResponseHelper.success(
        res,
        updatedBudget,
        RESPONSE_MESSAGES.SUCCESS.UPDATED
      );
    } catch (error) {
      console.error('Update budget error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async deleteBudget(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const deleted = await Budget.destroy({
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
      console.error('Delete budget error:', error);
      return ResponseHelper.error(res);
    }
  }
}

module.exports = BudgetController;
