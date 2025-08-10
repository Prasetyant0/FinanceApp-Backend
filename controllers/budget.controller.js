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

      return ResponseHelper.success(
        res,
        budget,
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

      return ResponseHelper.success(res, budgets);
    } catch (error) {
      console.error('Get budgets error:', error);
      return ResponseHelper.error(res);
    }
  }

  static async getBudgetDetail(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const budget = await BudgetService.getBudgetWithSpending(userId, id);

      return ResponseHelper.success(res, budget);
    } catch (error) {
      console.error('Get budget detail error:', error);

      if (error.message === 'Budget not found') {
        return ResponseHelper.error(
          res,
          RESPONSE_MESSAGES.ERROR.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

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
