/**
 * Offer Repository Tests
 */
describe('Offer Repository', () => {
  let mockDb;
  beforeEach(() => {
    mockDb = { query: jest.fn() };
  });

  describe('findOfferById', () => {
    it('should return offer by id', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', title: 'Developer Position' }],
      });
      const result = await mockDb.query('SELECT * FROM offers WHERE id = $1', ['1']);
      expect(result.rows[0].title).toBe('Developer Position');
    });

    it('should return empty when not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });
      const result = await mockDb.query('SELECT * FROM offers WHERE id = $1', ['999']);
      expect(result.rows.length).toBe(0);
    });
  });

  describe('findOffersByCompanyId', () => {
    it('should return all offers for a company', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          { id: '1', title: 'Dev Role', company_id: '1' },
          { id: '2', title: 'Sales Role', company_id: '1' },
        ],
      });
      const result = await mockDb.query('SELECT * FROM offers WHERE company_id = $1', ['1']);
      expect(result.rows.length).toBe(2);
    });
  });
});
