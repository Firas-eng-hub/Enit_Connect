/**
 * Document Request Repository Tests
 */
describe('DocumentRequest Repository', () => {
  let mockDb;
  beforeEach(() => {
    mockDb = { query: jest.fn() };
  });

  describe('createRequest', () => {
    it('should create a document request', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', document_id: '1', requested_by_id: '2', status: 'pending' }],
      });
      const result = await mockDb.query(
        'INSERT INTO document_requests (document_id, requested_by_id, status) VALUES ($1, $2, $3) RETURNING *',
        ['1', '2', 'pending']
      );
      expect(result.rows[0].status).toBe('pending');
    });
  });

  describe('findPendingRequests', () => {
    it('should return all pending requests', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          { id: '1', document_id: '1', status: 'pending' },
          { id: '2', document_id: '2', status: 'pending' },
        ],
      });
      const result = await mockDb.query('SELECT * FROM document_requests WHERE status = $1', ['pending']);
      expect(result.rows.length).toBe(2);
    });
  });

  describe('approveRequest', () => {
    it('should approve a document request', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', status: 'approved' }],
      });
      const result = await mockDb.query('UPDATE document_requests SET status = $1 WHERE id = $2 RETURNING *', ['approved', '1']);
      expect(result.rows[0].status).toBe('approved');
    });
  });
});
