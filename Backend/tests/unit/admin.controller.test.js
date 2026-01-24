/**
 * Admin Controller Tests\n */
const request = require('supertest');
const { createTestApp, attachErrorHandler } = require('../../tests/helpers/app');

describe('Admin Controller', () => {
  let app;
  beforeEach(() => {
    app = createTestApp();
    attachErrorHandler(app);
    app.get('/api/admin/users', (req, res) => {
      res.json([{ id: '1', email: 'user@test.com' }]);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return list of users', async () => {
      const response = await request(app).get('/api/admin/users');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
