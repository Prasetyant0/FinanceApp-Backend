const BudgetService = require('../../src/services/budget.service');
const TestHelper = require('../helpers/testHelper');
const db = require('../../models');

jest.mock('../../src/services/notification.service', () => ({
  createBudgetAlert: jest.fn().mockResolvedValue(true),
  // Method lain jika diperlukan...
}));

describe('BudgetService', () => {
  let user, categories;

  beforeAll(async () => {
    await TestHelper.setupTestDB();
    user = await TestHelper.createTestUser();
    categories = await db.Category.findAll();
  });

  afterAll(async () => {
    await TestHelper.cleanupTestDB();
  });

  beforeEach(async () => {
    await db.Budget.destroy({ where: {}, force: true });
    await db.Transaction.destroy({ where: {}, force: true });
  });

  describe('createBudget', () => {
    it('should create budget with calculated end date', async () => {
      const expenseCategory = categories.find(c => c.type === 'expense');
      const budgetData = {
        category_id: expenseCategory.id,
        amount: 1000000,
        period: 'monthly',
        start_date: '2024-01-01'
      };

      const budget = await BudgetService.createBudget(user.id, budgetData);

      expect(parseFloat(budget.amount)).toBe(1000000);
      expect(budget.period).toBe('monthly');
      expect(budget.end_date).toBeDefined();
    });

    it('should throw error for duplicate budget', async () => {
      const expenseCategory = categories.find(c => c.type === 'expense');
      const budgetData = {
        category_id: expenseCategory.id,
        amount: 1000000,
        period: 'monthly',
        start_date: '2024-01-01'
      };

      await BudgetService.createBudget(user.id, budgetData);

      await expect(BudgetService.createBudget(user.id, budgetData))
        .rejects.toThrow('already exists');
    });
  });

  describe('checkBudgetAlerts', () => {
    it('should return alert when threshold exceeded', async () => {
      const expenseCategory = categories.find(c => c.type === 'expense');

      // Create budget with 80% threshold
      const budget = await TestHelper.createTestBudget(user.id, expenseCategory.id, {
        amount: 1000000,
        alert_threshold: 80,
        start_date: new Date(),
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 1))
      });

      // Create transaction that brings total to 85% of budget
      await TestHelper.createTestTransaction(user.id, expenseCategory.id, {
        type: 'expense',
        amount: 700000 // 70% of budget
      });

      // New transaction that will push over threshold
      const alerts = await BudgetService.checkBudgetAlerts(user.id, expenseCategory.id, 200000);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].spent_percentage).toBeGreaterThan(80);
      expect(alerts[0].message).toContain('Budget alert');
    });
  });
});
