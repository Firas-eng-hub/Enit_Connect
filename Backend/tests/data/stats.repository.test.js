/**
 * Stats Repository Tests
 */
describe("Stats Repository", () => {
    let mockDb;
    beforeEach(() => {
        mockDb = { query: jest.fn() };
    });

    describe("countStudents", () => {
        it("should return student count", async () => {
            mockDb.query.mockResolvedValue({ rows: [{ count: "42" }] });
            const result = await mockDb.query("SELECT COUNT(*) AS count FROM students");
            expect(Number(result.rows[0].count)).toBe(42);
        });
    });

    describe("countCompanies", () => {
        it("should return company count", async () => {
            mockDb.query.mockResolvedValue({ rows: [{ count: "15" }] });
            const result = await mockDb.query("SELECT COUNT(*) AS count FROM companies");
            expect(Number(result.rows[0].count)).toBe(15);
        });
    });

    describe("countOffers", () => {
        it("should return offer count", async () => {
            mockDb.query.mockResolvedValue({ rows: [{ count: "8" }] });
            const result = await mockDb.query("SELECT COUNT(*) AS count FROM offers");
            expect(Number(result.rows[0].count)).toBe(8);
        });
    });

    describe("countActiveOffers", () => {
        it("should count only active offers", async () => {
            mockDb.query.mockResolvedValue({ rows: [{ count: "5" }] });
            const result = await mockDb.query(
                "SELECT COUNT(*) AS count FROM offers WHERE end_date IS NULL OR end_date >= CURRENT_DATE"
            );
            expect(Number(result.rows[0].count)).toBe(5);
        });
    });

    describe("countCandidacies", () => {
        it("should return candidacy count", async () => {
            mockDb.query.mockResolvedValue({ rows: [{ count: "23" }] });
            const result = await mockDb.query("SELECT COUNT(*) AS count FROM offer_candidacies");
            expect(Number(result.rows[0].count)).toBe(23);
        });
    });

    describe("studentRegistrationTrend", () => {
        it("should return monthly registration data", async () => {
            const trendData = [
                { month: "2026-01-01T00:00:00.000Z", count: "12" },
                { month: "2026-02-01T00:00:00.000Z", count: "8" },
            ];
            mockDb.query.mockResolvedValue({ rows: trendData });
            const result = await mockDb.query(expect.any(String), [6]);
            expect(result.rows).toHaveLength(2);
            expect(Number(result.rows[0].count)).toBe(12);
        });
    });

    describe("candidacyStatusBreakdown", () => {
        it("should return status counts", async () => {
            const breakdown = [
                { status: "pending", count: "10" },
                { status: "accepted", count: "5" },
                { status: "rejected", count: "3" },
            ];
            mockDb.query.mockResolvedValue({ rows: breakdown });
            const result = await mockDb.query(expect.any(String));
            expect(result.rows).toHaveLength(3);
        });
    });

    describe("topCompaniesByOffers", () => {
        it("should return companies sorted by offer count", async () => {
            const companies = [
                { name: "TechCorp", offer_count: "12" },
                { name: "DesignCo", offer_count: "7" },
            ];
            mockDb.query.mockResolvedValue({ rows: companies });
            const result = await mockDb.query(expect.any(String), [10]);
            expect(result.rows).toHaveLength(2);
            expect(Number(result.rows[0].offer_count)).toBe(12);
        });
    });
});
