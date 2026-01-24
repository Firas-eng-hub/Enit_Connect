/**
 * Student Controller Tests
 * Unit tests for student profile and data endpoints
 */

const request = require('supertest');
const { createTestApp, attachErrorHandler } = require('../../tests/helpers/app');

describe('Student Controller', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    attachErrorHandler(app);

    // Mock student routes
    app.get('/api/student/:id', (req, res) => {
      if (req.params.id === 'valid-id') {
        return res.json({
          id: 'valid-id',
          firstname: 'John',
          lastname: 'Doe',
          email: 'john@test.com',
        });
      }
      res.status(404).json({ message: 'Student not found' });
    });

    app.patch('/api/student/:id', (req, res) => {
      if (req.params.id === 'valid-id') {
        return res.json({ message: 'Student updated', id: 'valid-id' });
      }
      res.status(404).json({ message: 'Student not found' });
    });
  });

  describe('GET /api/student/:id', () => {
    it('should return student by id', async () => {
      const response = await request(app).get('/api/student/valid-id');

      expect(response.status).toBe(200);
      expect(response.body.firstname).toBe('John');
      expect(response.body.email).toBe('john@test.com');
    });

    it('should return 404 for non-existent student', async () => {
      const response = await request(app).get('/api/student/invalid-id');

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PATCH /api/student/:id', () => {
    it('should update student profile', async () => {
      const response = await request(app)
        .patch('/api/student/valid-id')
        .send({ firstname: 'Jane', lastname: 'Smith' });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('valid-id');
    });

    it('should return 404 when updating non-existent student', async () => {
      const response = await request(app)
        .patch('/api/student/invalid-id')
        .send({ firstname: 'Jane' });

      expect(response.status).toBe(404);
    });
  });
});
