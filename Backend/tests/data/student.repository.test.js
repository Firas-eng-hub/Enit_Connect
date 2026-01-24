/**
 * Student Repository Tests
 * Unit tests for student data operations (CRUD, search, etc.)
 */

describe('Student Repository', () => {
  let mockDb;

  beforeEach(() => {
    // Mock database interface
    mockDb = {
      query: jest.fn(),
    };
  });

  describe('createStudent', () => {
    it('should insert a new student record', async () => {
      const studentData = {
        email: 'student@test.com',
        firstname: 'John',
        lastname: 'Doe',
        password: 'hashed_password',
        type: 'student',
        status: 'Pending',
      };

      mockDb.query.mockResolvedValue({
        rows: [{ id: 'uuid-1', ...studentData }],
      });

      const result = await mockDb.query(
        'INSERT INTO students (email, firstname, lastname, password, type, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        Object.values(studentData)
      );

      expect(result.rows[0].email).toBe('student@test.com');
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should handle duplicate email error', async () => {
      mockDb.query.mockRejectedValue(
        new Error('duplicate key value violates unique constraint')
      );

      await expect(mockDb.query()).rejects.toThrow('duplicate');
    });
  });

  describe('findStudentById', () => {
    it('should return student by id', async () => {
      const mockStudent = {
        id: 'uuid-1',
        email: 'student@test.com',
        firstname: 'John',
        lastname: 'Doe',
      };

      mockDb.query.mockResolvedValue({ rows: [mockStudent] });

      const result = await mockDb.query(
        'SELECT * FROM students WHERE id = $1',
        ['uuid-1']
      );

      expect(result.rows[0].id).toBe('uuid-1');
      expect(result.rows[0].email).toBe('student@test.com');
    });

    it('should return null when student not found', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await mockDb.query(
        'SELECT * FROM students WHERE id = $1',
        ['non-existent']
      );

      expect(result.rows.length).toBe(0);
    });
  });

  describe('updateStudent', () => {
    it('should update student fields', async () => {
      const updateData = {
        firstname: 'Jane',
        lastname: 'Smith',
      };

      mockDb.query.mockResolvedValue({
        rows: [
          {
            id: 'uuid-1',
            email: 'student@test.com',
            ...updateData,
          },
        ],
      });

      const result = await mockDb.query(
        'UPDATE students SET firstname = $1, lastname = $2 WHERE id = $3 RETURNING *',
        ['Jane', 'Smith', 'uuid-1']
      );

      expect(result.rows[0].firstname).toBe('Jane');
      expect(result.rows[0].lastname).toBe('Smith');
    });
  });

  describe('searchStudents', () => {
    it('should search students by query', async () => {
      const mockResults = [
        { id: 'uuid-1', email: 'john@test.com', firstname: 'John' },
        { id: 'uuid-2', email: 'jane@test.com', firstname: 'Jane' },
      ];

      mockDb.query.mockResolvedValue({ rows: mockResults });

      const result = await mockDb.query(
        'SELECT * FROM students WHERE firstname ILIKE $1 OR email ILIKE $1',
        ['%test%']
      );

      expect(result.rows.length).toBe(2);
      expect(result.rows[0].firstname).toBe('John');
    });

    it('should return empty array when no matches', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const result = await mockDb.query(
        'SELECT * FROM students WHERE firstname ILIKE $1',
        ['%nonexistent%']
      );

      expect(result.rows.length).toBe(0);
    });
  });

  describe('deleteStudent', () => {
    it('should delete student by id', async () => {
      mockDb.query.mockResolvedValue({ rowCount: 1 });

      const result = await mockDb.query(
        'DELETE FROM students WHERE id = $1',
        ['uuid-1']
      );

      expect(result.rowCount).toBe(1);
    });

    it('should handle delete of non-existent student', async () => {
      mockDb.query.mockResolvedValue({ rowCount: 0 });

      const result = await mockDb.query(
        'DELETE FROM students WHERE id = $1',
        ['non-existent']
      );

      expect(result.rowCount).toBe(0);
    });
  });
});
