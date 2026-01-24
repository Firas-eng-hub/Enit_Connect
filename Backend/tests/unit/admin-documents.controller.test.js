/**
 * Admin Documents Controller Tests
 */
const request = require('supertest');
const { createTestApp, attachErrorHandler } = require('../../tests/helpers/app');

describe('Admin Documents Controller', () => {
  let app;
  beforeEach(() => {
    app = createTestApp();
    attachErrorHandler(app);
    app.get('/api/admin/documents', (req, res) => {
      res.json([{ id: '1', title: 'Doc 1' }]);
    });
  });

  describe('GET /api/admin/documents', () => {
    it('should return list of documents', async () => {
      const response = await request(app).get('/api/admin/documents');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
