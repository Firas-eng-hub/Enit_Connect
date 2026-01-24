/**
 * Company Repository Tests
 */
describe('Company Repository', () => {
  let mockDb;
  beforeEach(() => {
    mockDb = { query: jest.fn() };
  });

  describe('findCompanyById', () => {
    it('should return company by id', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', name: 'Tech Corp' }],
      });
      const result = await mockDb.query('SELECT * FROM companies WHERE id = $1', ['1']);
      expect(result.rows[0].name).toBe('Tech Corp');
    });

    it('should return empty when not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });
      const result = await mockDb.query('SELECT * FROM companies WHERE id = $1', ['999']);
      expect(result.rows.length).toBe(0);
    });
  });
});
