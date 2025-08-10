const request = require('supertest');
const app = require('../server');
const TestHelper = require('./helpers/testHelper');
const db = require('../models');

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    await TestHelper.setupTestDB();
  });

  afterAll(async () => {
    await TestHelper.cleanupTestDB();
  });

  beforeEach(async () => {
    // Clean users table before each test
    await db.User.destroy({ where: {}, force: true });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      // Register first user
      await request(app).post('/api/auth/register').send(userData);

      // Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already registered');
    });

    it('should return validation error for invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await TestHelper.createTestUser();
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should return error for wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });

    it('should return error for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    let token, user;

    beforeEach(async () => {
      user = await TestHelper.createTestUser();
      token = await TestHelper.loginUser(app);
    });

    it('should return user profile when authenticated', async () => {
      const response = await TestHelper.authenticatedRequest(app, 'get', '/api/auth/me', token);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.email).toBe(user.email);
      expect(response.body.data.password).toBeUndefined();
    });

    it('should return error when not authenticated', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return error with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
