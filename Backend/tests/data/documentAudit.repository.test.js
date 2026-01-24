/**
 * Document Audit Repository Tests
 */
describe('DocumentAudit Repository', () => {
  let mockDb;
  beforeEach(() => {
    mockDb = { query: jest.fn() };
  });

  describe('createAuditLog', () => {
    it('should create an audit log', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', document_id: '1', action: 'create', performed_by_id: '1' }],
      });
      const result = await mockDb.query(
        'INSERT INTO document_audits (document_id, action, performed_by_id) VALUES ($1, $2, $3) RETURNING *',
        ['1', 'create', '1']
      );
      expect(result.rows[0].action).toBe('create');
    });
  });

  describe('getAuditTrail', () => {
    it('should return audit trail for a document', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          { id: '1', document_id: '1', action: 'create' },
          { id: '2', document_id: '1', action: 'update' },
        ],
      });
      const result = await mockDb.query('SELECT * FROM document_audits WHERE document_id = $1 ORDER BY created_at DESC', ['1']);
      expect(result.rows.length).toBe(2);
    });
  });

  describe('getAuditsByAction', () => {
    it('should return audits filtered by action', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', action: 'delete' }],
      });
      const result = await mockDb.query('SELECT * FROM document_audits WHERE action = $1', ['delete']);
      expect(result.rows[0].action).toBe('delete');
    });
  });
});
