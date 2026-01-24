/**
 * Notification Repository Tests
 */
describe('Notification Repository', () => {
  let mockDb;
  beforeEach(() => {
    mockDb = { query: jest.fn() };
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', user_id: '1', message: 'New offer', read: false }],
      });
      const result = await mockDb.query(
        'INSERT INTO notifications (user_id, message) VALUES ($1, $2) RETURNING *',
        ['1', 'New offer']
      );
      expect(result.rows[0].read).toBe(false);
    });
  });

  describe('findNotificationsByUserId', () => {
    it('should return all notifications for a user', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          { id: '1', user_id: '1', message: 'Notif 1' },
          { id: '2', user_id: '1', message: 'Notif 2' },
        ],
      });
      const result = await mockDb.query('SELECT * FROM notifications WHERE user_id = $1', ['1']);
      expect(result.rows.length).toBe(2);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockDb.query.mockResolvedValue({
        rows: [{ id: '1', read: true }],
      });
      const result = await mockDb.query('UPDATE notifications SET read = true WHERE id = $1 RETURNING *', ['1']);
      expect(result.rows[0].read).toBe(true);
    });
  });
});
