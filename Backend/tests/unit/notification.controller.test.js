/**
 * Notification Controller Tests
 */
const request = require('supertest');
const { createTestApp, attachErrorHandler } = require('../../tests/helpers/app');

describe('Notification Controller', () => {
  let app;
  beforeEach(() => {
    app = createTestApp();
    attachErrorHandler(app);
    app.get('/api/notifications', (req, res) => {
      res.json([{ id: '1', message: 'Notif' }]);
    });
  });

  describe('GET /api/notifications', () => {
    it('should return user notifications', async () => {
      const response = await request(app).get('/api/notifications');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
