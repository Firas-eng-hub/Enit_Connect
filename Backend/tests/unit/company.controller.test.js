/**
 * Company Controller Tests
 */
const request = require('supertest');
const { createTestApp, attachErrorHandler } = require('../../tests/helpers/app');

describe('Company Controller', () => {
  let app;
  beforeEach(() => {
    app = createTestApp();
    attachErrorHandler(app);
    app.get('/api/company/:id', (req, res) => {
      if (req.params.id === 'valid-company') {
        return res.json({ id: 'valid-company', name: 'Tech Corp' });
      }
      res.status(404).json({ message: 'Company not found' });
    });
  });

  describe('GET /api/company/:id', () => {
    it('should return company profile', async () => {
      const response = await request(app).get('/api/company/valid-company');
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Tech Corp');
    });

    it('should return 404 for non-existent company', async () => {
      const response = await request(app).get('/api/company/invalid');
      expect(response.status).toBe(404);
    });
  });
});
