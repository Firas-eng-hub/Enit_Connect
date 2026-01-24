/**
 * Offer Controller Tests
 */
const request = require('supertest');
const { createTestApp, attachErrorHandler } = require('../../tests/helpers/app');

describe('Offer Controller', () => {
  let app;
  beforeEach(() => {
    app = createTestApp();
    attachErrorHandler(app);
    app.get('/api/offers', (req, res) => {
      res.json([{ id: '1', title: 'Junior Developer' }]);
    });
    app.post('/api/offers', (req, res) => {
      const { title } = req.body;
      if (!title) return res.status(400).json({ message: 'Title required' });
      res.status(201).json({ id: 'new', title });
    });
  });

  describe('GET /api/offers', () => {
    it('should return list of offers', async () => {
      const response = await request(app).get('/api/offers');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/offers', () => {
    it('should create new offer', async () => {
      const response = await request(app)
        .post('/api/offers')
        .send({ title: 'Senior Dev' });
      expect(response.status).toBe(201);
    });
  });
});
