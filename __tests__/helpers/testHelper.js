const request = require('supertest');
const db = require('../../models');
const { User, Category, Transaction, Budget } = db;

class TestHelper {
  static async setupTestDB() {
    try {
      // Test database connection
      await db.sequelize.authenticate();
      console.log('✅ Test database connected');

      // Sync database with force to clean slate
      await db.sequelize.sync({ force: true });
      console.log('✅ Test database synced');

      // Create default categories
      await this.createDefaultCategories();
      console.log('✅ Default categories created');
    } catch (error) {
      console.error('❌ Test database setup failed:', error);
      throw error;
    }
  }

  static async cleanupTestDB() {
    try {
      await db.sequelize.close();
      console.log('✅ Test database connection closed');
    } catch (error) {
      console.error('❌ Test database cleanup failed:', error);
    }
  }

  static async createTestUser(userData = {}) {
    const defaultUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    return await User.scope('withPassword').create({ ...defaultUser, ...userData });
  }

  static async createDefaultCategories() {
    const categories = [
      { name: 'Makanan', type: 'expense', icon: '🍽️', color: '#ef4444', is_default: true },
      { name: 'Transport', type: 'expense', icon: '🚗', color: '#f59e0b', is_default: true },
      { name: 'Gaji', type: 'income', icon: '💰', color: '#10b981', is_default: true },
      { name: 'Freelance', type: 'income', icon: '💻', color: '#059669', is_default: true }
    ];

    return await Category.bulkCreate(categories);
  }

  static async createTestTransaction(userId, categoryId, transactionData = {}) {
    const defaultTransaction = {
      user_id: userId,
      category_id: categoryId,
      type: 'expense',
      amount: 50000,
      description: 'Test transaction',
      transaction_date: new Date()
    };

    return await Transaction.create({ ...defaultTransaction, ...transactionData });
  }

  static async createTestBudget(userId, categoryId, budgetData = {}) {
    const defaultBudget = {
      user_id: userId,
      category_id: categoryId,
      amount: 1000000,
      period: 'monthly',
      start_date: new Date(),
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 1))
    };

    return await Budget.create({ ...defaultBudget, ...budgetData });
  }

  static async loginUser(app, email = 'test@example.com', password = 'password123') {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    if (!response.body.success) {
      throw new Error(`Login failed: ${response.body.message}`);
    }

    return response.body.data.tokens.accessToken;
  }

  static async authenticatedRequest(app, method, endpoint, token, data = null) {
    const req = request(app)[method](endpoint).set('Authorization', `Bearer ${token}`);

    if (data && (method === 'post' || method === 'put' || method === 'patch')) {
      return req.send(data);
    }

    return req;
  }
}

module.exports = TestHelper;
