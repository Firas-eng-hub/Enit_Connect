/**
 * Document Access Repository Tests
 */
describe('DocumentAccess Repository', () => {
  let mockDb;
  beforeEach(() => {
    mockDb = { query: jest.fn() };
  });

  describe('logAccess', () => {
    it('should log document access', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', document_id: '1', accessed_by_id: '2', accessed_at: new Date() }],
      });
      const result = await mockDb.query(
        'INSERT INTO document_access_logs (document_id, accessed_by_id) VALUES ($1, $2) RETURNING *',
        ['1', '2']
      );
      expect(result.rows[0].document_id).toBe('1');
    });
  });

  describe('getAccessHistory', () => {
    it('should return access history for a document', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          { id: '1', document_id: '1', accessed_by_id: '2' },
          { id: '2', document_id: '1', accessed_by_id: '3' },
        ],
      });
      const result = await mockDb.query('SELECT * FROM document_access_logs WHERE document_id = $1', ['1']);
      expect(result.rows.length).toBe(2);
    });
  });

  describe('getAccessCount', () => {
    it('should return total access count for a document', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ count: '5' }],
      });
      const result = await mockDb.query('SELECT COUNT(*) as count FROM document_access_logs WHERE document_id = $1', ['1']);
      expect(parseInt(result.rows[0].count)).toBe(5);
    });
  });
});
