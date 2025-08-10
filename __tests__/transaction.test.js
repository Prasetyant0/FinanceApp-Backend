const request = require('supertest');
const app = require('../server');
const TestHelper = require('./helpers/testHelper');
const db = require('../models');

describe('Transaction Endpoints', () => {
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
    await db.Transaction.destroy({ where: {}, force: true });
  });

  describe('POST /api/transactions', () => {
    it('should create transaction successfully', async () => {
      const expenseCategory = categories.find(c => c.type === 'expense');
      const transactionData = {
        category_id: expenseCategory.id,
        type: 'expense',
        amount: 75000,
        description: 'Test expense'
      };

      const response = await TestHelper.authenticatedRequest(
        app, 'post', '/api/transactions', token, transactionData
      );

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction.amount).toBe('75000.00');
      expect(response.body.data.transaction.description).toBe('Test expense');
      expect(response.body.data.transaction.category).toBeDefined();
    });

    it('should return error for mismatched category type', async () => {
      const incomeCategory = categories.find(c => c.type === 'income');
      const transactionData = {
        category_id: incomeCategory.id,
        type: 'expense', // Mismatch: income category with expense type
        amount: 50000,
        description: 'Test transaction'
      };

      const response = await TestHelper.authenticatedRequest(
        app, 'post', '/api/transactions', token, transactionData
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("doesn't match transaction type");
    });

    it('should return validation error for missing fields', async () => {
      const transactionData = {
        type: 'expense',
        amount: 50000
        // Missing category_id
      };

      const response = await TestHelper.authenticatedRequest(
        app, 'post', '/api/transactions', token, transactionData
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });
  });

  describe('GET /api/transactions', () => {
    beforeEach(async () => {
      const expenseCategory = categories.find(c => c.type === 'expense');
      const incomeCategory = categories.find(c => c.type === 'income');

      // Create test transactions
      await TestHelper.createTestTransaction(user.id, expenseCategory.id, {
        type: 'expense',
        amount: 100000,
        description: 'Expense 1'
      });

      await TestHelper.createTestTransaction(user.id, incomeCategory.id, {
        type: 'income',
        amount: 200000,
        description: 'Income 1'
      });
    });

    it('should get all transactions', async () => {
      const response = await TestHelper.authenticatedRequest(
        app, 'get', '/api/transactions', token
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(2);
      expect(response.body.pagination.totalItems).toBe(2);
    });

    it('should filter transactions by type', async () => {
      const response = await TestHelper.authenticatedRequest(
        app, 'get', '/api/transactions?type=expense', token
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(1);
      expect(response.body.data.transactions[0].type).toBe('expense');
    });

    it('should paginate transactions', async () => {
      const response = await TestHelper.authenticatedRequest(
        app, 'get', '/api/transactions?limit=1&page=1', token
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/transactions/dashboard', () => {
    beforeEach(async () => {
      const expenseCategory = categories.find(c => c.type === 'expense');
      const incomeCategory = categories.find(c => c.type === 'income');

      await TestHelper.createTestTransaction(user.id, expenseCategory.id, {
        type: 'expense',
        amount: 150000
      });

      await TestHelper.createTestTransaction(user.id, incomeCategory.id, {
        type: 'income',
        amount: 300000
      });
    });

    it('should return dashboard statistics', async () => {
      const response = await TestHelper.authenticatedRequest(
        app, 'get', '/api/transactions/dashboard', token
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.income).toBe(300000);
      expect(response.body.data.summary.expense).toBe(150000);
      expect(response.body.data.summary.balance).toBe(150000);
      expect(response.body.data.recentTransactions).toBeDefined();
      expect(response.body.data.expensesByCategory).toBeDefined();
    });
  });
});
