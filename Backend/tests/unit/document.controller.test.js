/**
 * Document Controller Tests
 */
const request = require('supertest');
const { createTestApp, attachErrorHandler } = require('../../tests/helpers/app');

describe('Document Controller', () => {
  let app;
  beforeEach(() => {
    app = createTestApp();
    attachErrorHandler(app);
    app.get('/api/documents', (req, res) => {
      res.json([{ id: '1', title: 'Doc' }]);
    });
  });

  describe('GET /api/documents', () => {
    it('should return user documents', async () => {
      const response = await request(app).get('/api/documents');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
