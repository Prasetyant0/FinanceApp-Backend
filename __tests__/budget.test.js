const request = require('supertest');
const app = require('../server');
const TestHelper = require('./helpers/testHelper');
const db = require('../models');

describe('Budget Endpoints', () => {
  let user, token, categories;

  beforeAll(async () => {
    await TestHelper.setupTestDB();
    user = await TestHelper.createTestUser();
    token = await TestHelper.loginUser(app);
    categories = await db.Category.findAll();
  });

  afterAll(async () => {
    await TestHelper.cleanupTestDB();
  });

  beforeEach(async () => {
    // Clean dalam urutan yang benar untuk menghindari foreign key issues
    await db.Transaction.destroy({ where: {}, force: true });
    await db.Budget.destroy({ where: {}, force: true });
  });

  describe('POST /api/budgets', () => {
    it('should create budget successfully', async () => {
      const expenseCategory = categories.find(c => c.type === 'expense');
      const budgetData = {
        category_id: expenseCategory.id,
        amount: 1000000,
        period: 'monthly',
        start_date: '2024-01-01',
        alert_threshold: 80
      };

      const response = await TestHelper.authenticatedRequest(
        app, 'post', '/api/budgets', token, budgetData
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe('1000000.00');
      expect(response.body.data.period).toBe('monthly');
      expect(response.body.data.alert_threshold).toBe(80);
    });

    it('should return error for duplicate budget', async () => {
      const expenseCategory = categories.find(c => c.type === 'expense');
      const budgetData = {
        category_id: expenseCategory.id,
        amount: 1000000,
        period: 'monthly',
        start_date: '2024-01-01'
      };

      // Create first budget
      await TestHelper.authenticatedRequest(app, 'post', '/api/budgets', token, budgetData);

      // Try to create duplicate - harus dengan data yang persis sama
      const response = await TestHelper.authenticatedRequest(
        app, 'post', '/api/budgets', token, budgetData
      );

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /api/budgets', () => {
    beforeEach(async () => {
      const expenseCategory = categories.find(c => c.type === 'expense');
      await TestHelper.createTestBudget(user.id, expenseCategory.id, {
        amount: 1500000,
        period: 'monthly'
      });
    });

    it('should get all budgets', async () => {
      const response = await TestHelper.authenticatedRequest(
        app, 'get', '/api/budgets', token
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].amount).toBe('1500000.00');
      expect(response.body.data[0].category).toBeDefined();
    });
  });

  describe('GET /api/budgets/:id', () => {
    let budget, expenseCategory;

    beforeEach(async () => {
      expenseCategory = categories.find(c => c.type === 'expense');
      budget = await TestHelper.createTestBudget(user.id, expenseCategory.id);

      // Create some transactions to test spending calculation
      await TestHelper.createTestTransaction(user.id, expenseCategory.id, {
        type: 'expense',
        amount: 200000,
        transaction_date: new Date()
      });
    });

    it('should get budget detail with spending calculation', async () => {
      const response = await TestHelper.authenticatedRequest(
        app, 'get', `/api/budgets/${budget.id}`, token
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.spending).toBeDefined();
      expect(response.body.data.spending.total_spent).toBe('200000.00'); // String format
      expect(response.body.data.spending.remaining).toBe('800000.00');   // String format
      expect(response.body.data.spending.spent_percentage).toBeGreaterThan(0);
    });
  });
});
