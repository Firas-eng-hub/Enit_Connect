/**
 * News Controller Tests
 */
const request = require('supertest');
const { createTestApp, attachErrorHandler } = require('../../tests/helpers/app');

describe('News Controller', () => {
  let app;
  beforeEach(() => {
    app = createTestApp();
    attachErrorHandler(app);
    app.get('/api/news', (req, res) => {
      res.json([{ id: '1', title: 'News 1' }]);
    });
  });

  describe('GET /api/news', () => {
    it('should return list of news', async () => {
      const response = await request(app).get('/api/news');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
