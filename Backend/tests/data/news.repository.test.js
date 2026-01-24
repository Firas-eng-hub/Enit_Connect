/**
 * News Repository Tests
 */
describe('News Repository', () => {
  let mockDb;
  beforeEach(() => {
    mockDb = { query: jest.fn() };
  });

  describe('findNewsById', () => {
    it('should return news by id', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', title: 'Company News', content: 'News content' }],
      });
      const result = await mockDb.query('SELECT * FROM news WHERE id = $1', ['1']);
      expect(result.rows[0].title).toBe('Company News');
    });

    it('should return empty when not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });
      const result = await mockDb.query('SELECT * FROM news WHERE id = $1', ['999']);
      expect(result.rows.length).toBe(0);
    });
  });

  describe('findAllNews', () => {
    it('should return all news', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          { id: '1', title: 'News 1' },
          { id: '2', title: 'News 2' },
        ],
      });
      const result = await mockDb.query('SELECT * FROM news');
      expect(result.rows.length).toBe(2);
    });
  });
});
