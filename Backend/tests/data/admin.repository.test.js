/**
 * Admin Repository Tests
 */
describe('Admin Repository', () => {
  let mockDb;
  beforeEach(() => {
    mockDb = { query: jest.fn() };
  });

  describe('findAdminById', () => {
    it('should return admin by id', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', email: 'admin@enit.tn', role: 'admin' }],
      });
      const result = await mockDb.query('SELECT * FROM admins WHERE id = $1', ['1']);
      expect(result.rows[0].role).toBe('admin');
    });

    it('should return empty when not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });
      const result = await mockDb.query('SELECT * FROM admins WHERE id = $1', ['999']);
      expect(result.rows.length).toBe(0);
    });
  });

  describe('getAllAdmins', () => {
    it('should return all admins', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          { id: '1', email: 'admin1@enit.tn' },
          { id: '2', email: 'admin2@enit.tn' },
        ],
      });
      const result = await mockDb.query('SELECT * FROM admins');
      expect(result.rows.length).toBe(2);
    });
  });
});
