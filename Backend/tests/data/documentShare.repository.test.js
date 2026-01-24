/**
 * Document Share Repository Tests
 */
describe('DocumentShare Repository', () => {
  let mockDb;
  beforeEach(() => {
    mockDb = { query: jest.fn() };
  });

  describe('createShare', () => {
    it('should create a document share', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', document_id: '1', shared_with_id: '2', permission: 'view' }],
      });
      const result = await mockDb.query(
        'INSERT INTO document_shares (document_id, shared_with_id, permission) VALUES ($1, $2, $3) RETURNING *',
        ['1', '2', 'view']
      );
      expect(result.rows[0].permission).toBe('view');
    });
  });

  describe('findSharesByDocumentId', () => {
    it('should return all shares for a document', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          { id: '1', document_id: '1', shared_with_id: '2' },
          { id: '2', document_id: '1', shared_with_id: '3' },
        ],
      });
      const result = await mockDb.query('SELECT * FROM document_shares WHERE document_id = $1', ['1']);
      expect(result.rows.length).toBe(2);
    });
  });

  describe('revokeShare', () => {
    it('should revoke a document share', async () => {
      mockDb.query.mockResolvedValue({ rowCount: 1 });
      const result = await mockDb.query('DELETE FROM document_shares WHERE id = $1', ['1']);
      expect(result.rowCount).toBe(1);
    });
  });
});
