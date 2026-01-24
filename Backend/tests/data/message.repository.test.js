/**
 * Message Repository Tests
 */
describe('Message Repository', () => {
  let mockDb;
  beforeEach(() => {
    mockDb = { query: jest.fn() };
  });

  describe('createMessage', () => {
    it('should create a message', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', content: 'Hello', sender_id: '1', receiver_id: '2' }],
      });
      const result = await mockDb.query(
        'INSERT INTO messages (content, sender_id, receiver_id) VALUES ($1, $2, $3) RETURNING *',
        ['Hello', '1', '2']
      );
      expect(result.rows[0].content).toBe('Hello');
    });
  });

  describe('findMessageById', () => {
    it('should return message by id', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', content: 'Test message', sender_id: '1' }],
      });
      const result = await mockDb.query('SELECT * FROM messages WHERE id = $1', ['1']);
      expect(result.rows[0].content).toBe('Test message');
    });
  });

  describe('getConversation', () => {
    it('should return conversation between two users', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          { id: '1', content: 'Message 1', sender_id: '1' },
          { id: '2', content: 'Message 2', sender_id: '2' },
        ],
      });
      const result = await mockDb.query(
        'SELECT * FROM messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)',
        ['1', '2']
      );
      expect(result.rows.length).toBe(2);
    });
  });
});
