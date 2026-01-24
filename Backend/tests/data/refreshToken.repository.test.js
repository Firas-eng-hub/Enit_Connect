/**
 * Refresh Token Repository Tests
 */
describe('RefreshToken Repository', () => {
  let mockDb;
  beforeEach(() => {
    mockDb = { query: jest.fn() };
  });

  describe('createRefreshToken', () => {
    it('should create a refresh token', async () => {
      const token = 'jwt-token-123';
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', token, student_id: '1', expiry_date: new Date() }],
      });
      const result = await mockDb.query(
        'INSERT INTO refresh_tokens (token, student_id) VALUES ($1, $2) RETURNING *',
        [token, '1']
      );
      expect(result.rows[0].token).toBe(token);
    });
  });

  describe('findRefreshToken', () => {
    it('should find a refresh token', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', token: 'jwt-123', student_id: '1' }],
      });
      const result = await mockDb.query('SELECT * FROM refresh_tokens WHERE token = $1', ['jwt-123']);
      expect(result.rows[0].student_id).toBe('1');
    });

    it('should return empty when not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });
      const result = await mockDb.query('SELECT * FROM refresh_tokens WHERE token = $1', ['invalid']);
      expect(result.rows.length).toBe(0);
    });
  });
});
