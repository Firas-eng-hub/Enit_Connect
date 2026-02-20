jest.mock("../../db", () => ({
    query: jest.fn(),
}));

const db = require("../../db");
const savedSearchRepository = require("../../repositories/savedSearch.repository");

describe("SavedSearch Repository", () => {
    afterEach(() => jest.clearAllMocks());

    describe("create", () => {
        it("should insert and return a saved search", async () => {
            const mockRow = {
                id: "abc-123",
                user_id: "user-1",
                user_type: "student",
                name: "PFE in Tunis",
                filters: JSON.stringify({ type: "PFE", q: "Tunis" }),
                notify: false,
                created_at: new Date(),
                updated_at: new Date(),
            };
            db.query.mockResolvedValueOnce({ rows: [mockRow] });

            const result = await savedSearchRepository.create({
                userId: "user-1",
                userType: "student",
                name: "PFE in Tunis",
                filters: { type: "PFE", q: "Tunis" },
            });
            expect(result.id).toBe("abc-123");
            expect(result.name).toBe("PFE in Tunis");
            expect(result.filters.type).toBe("PFE");
        });
    });

    describe("listByUser", () => {
        it("should list saved searches for user", async () => {
            db.query.mockResolvedValueOnce({
                rows: [
                    {
                        id: "s1", user_id: "u1", user_type: "student",
                        name: "Search 1", filters: "{}", notify: false,
                        created_at: new Date(), updated_at: new Date(),
                    },
                ],
            });

            const results = await savedSearchRepository.listByUser("u1", "student");
            expect(results).toHaveLength(1);
            expect(results[0].userId).toBe("u1");
        });
    });

    describe("deleteById", () => {
        it("should return true when deleted", async () => {
            db.query.mockResolvedValueOnce({ rowCount: 1 });
            const result = await savedSearchRepository.deleteById("s1", "u1");
            expect(result).toBe(true);
        });

        it("should return false when not found", async () => {
            db.query.mockResolvedValueOnce({ rowCount: 0 });
            const result = await savedSearchRepository.deleteById("s1", "u1");
            expect(result).toBe(false);
        });
    });
});
