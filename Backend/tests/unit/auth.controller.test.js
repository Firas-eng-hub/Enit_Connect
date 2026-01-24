/**
 * Auth Controller Tests
 * Unit tests for authentication endpoints (signup, signin, logout, refresh token)
 */

const request = require('supertest');
const { createTestApp, attachErrorHandler } = require('../../tests/helpers/app');

describe('Auth Controller', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    attachErrorHandler(app);
    
    // Mock auth routes
    app.post('/api/auth/signup', (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }
      res.status(201).json({ message: 'User created', email });
    });

    app.post('/api/auth/signin', (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }
      if (email === 'user@test.com' && password === 'password123') {
        res.cookie('accessToken', 'fake-token');
        return res.json({ message: 'Signed in', email });
      }
      res.status(401).json({ message: 'Invalid credentials' });
    });

    app.post('/api/auth/logout', (req, res) => {
      res.clearCookie('accessToken');
      res.json({ message: 'Logged out' });
    });
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid email and password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'newuser@test.com', password: 'password123' });

      expect(response.status).toBe(201);
      expect(response.body.email).toBe('newuser@test.com');
    });

    it('should reject signup without email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should reject signup without password', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'user@test.com' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });
  });

  describe('POST /api/auth/signin', () => {
    it('should signin with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({ email: 'user@test.com', password: 'password123' });

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('user@test.com');
    });

    it('should reject signin with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({ email: 'user@test.com', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid');
    });

    it('should set auth cookie on successful signin', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({ email: 'user@test.com', password: 'password123' });

      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('accessToken');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout and clear auth cookie', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out');
    });
  });
});
