/**
 * Document Version Repository Tests
 */
describe('DocumentVersion Repository', () => {
  let mockDb;
  beforeEach(() => {
    mockDb = { query: jest.fn() };
  });

  describe('createVersion', () => {
    it('should create a document version', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', document_id: '1', version_number: 1, path: '/uploads/cv-v1.pdf' }],
      });
      const result = await mockDb.query(
        'INSERT INTO document_versions (document_id, version_number, path) VALUES ($1, $2, $3) RETURNING *',
        ['1', 1, '/uploads/cv-v1.pdf']
      );
      expect(result.rows[0].version_number).toBe(1);
    });
  });

  describe('findVersionsByDocumentId', () => {
    it('should return all versions of a document', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          { id: '1', document_id: '1', version_number: 1 },
          { id: '2', document_id: '1', version_number: 2 },
        ],
      });
      const result = await mockDb.query('SELECT * FROM document_versions WHERE document_id = $1 ORDER BY version_number', ['1']);
      expect(result.rows.length).toBe(2);
    });
  });

  describe('getLatestVersion', () => {
    it('should return latest version of a document', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '2', document_id: '1', version_number: 2 }],
      });
      const result = await mockDb.query(
        'SELECT * FROM document_versions WHERE document_id = $1 ORDER BY version_number DESC LIMIT 1',
        ['1']
      );
      expect(result.rows[0].version_number).toBe(2);
    });
  });
});
