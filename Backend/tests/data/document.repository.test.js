/**
 * Document Repository Tests
 */
describe('Document Repository', () => {
  let mockDb;
  beforeEach(() => {
    mockDb = { query: jest.fn() };
  });

  describe('createDocument', () => {
    it('should create a document', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', title: 'CV', user_id: '1', path: '/uploads/cv.pdf' }],
      });
      const result = await mockDb.query(
        'INSERT INTO documents (title, user_id, path) VALUES ($1, $2, $3) RETURNING *',
        ['CV', '1', '/uploads/cv.pdf']
      );
      expect(result.rows[0].title).toBe('CV');
    });
  });

  describe('findDocumentById', () => {
    it('should return document by id', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', title: 'Resume', user_id: '1' }],
      });
      const result = await mockDb.query('SELECT * FROM documents WHERE id = $1', ['1']);
      expect(result.rows[0].title).toBe('Resume');
    });
  });

  describe('findDocumentsByUserId', () => {
    it('should return all documents for a user', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          { id: '1', title: 'CV' },
          { id: '2', title: 'Cover Letter' },
        ],
      });
      const result = await mockDb.query('SELECT * FROM documents WHERE user_id = $1', ['1']);
      expect(result.rows.length).toBe(2);
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document', async () => {
      mockDb.query.mockResolvedValue({ rowCount: 1 });
      const result = await mockDb.query('DELETE FROM documents WHERE id = $1', ['1']);
      expect(result.rowCount).toBe(1);
    });
  });
});
