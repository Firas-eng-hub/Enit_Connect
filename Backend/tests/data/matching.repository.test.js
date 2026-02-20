/**
 * Matching Repository Tests
 */
describe("Matching Repository", () => {
    let mockDb;
    beforeEach(() => {
        mockDb = { query: jest.fn() };
    });

    describe("listActiveOffersWithCompany", () => {
        it("should return active offers with company data", async () => {
            const rows = [
                {
                    id: "offer-1",
                    title: "PFE Developer",
                    type: "PFE",
                    company_name: "TechCorp",
                    company_city: "Tunis",
                    company_country: "Tunisia",
                },
                {
                    id: "offer-2",
                    title: "Stage Data Analyst",
                    type: "Stage",
                    company_name: "DataInc",
                    company_city: "Sousse",
                    company_country: "Tunisia",
                },
            ];
            mockDb.query.mockResolvedValue({ rows });
            const result = await mockDb.query(expect.any(String));
            expect(result.rows).toHaveLength(2);
            expect(result.rows[0]).toHaveProperty("company_name");
            expect(result.rows[0]).toHaveProperty("company_city");
        });

        it("should exclude expired offers", async () => {
            mockDb.query.mockResolvedValue({ rows: [] });
            const result = await mockDb.query(expect.any(String));
            expect(result.rows).toHaveLength(0);
        });
    });

    describe("listAppliedOfferIds", () => {
        it("should return distinct offer IDs for a student", async () => {
            mockDb.query.mockResolvedValue({
                rows: [{ offer_id: "offer-1" }, { offer_id: "offer-3" }],
            });
            const result = await mockDb.query(expect.any(String), ["student-1"]);
            const ids = result.rows.map((r) => r.offer_id);
            expect(ids).toEqual(["offer-1", "offer-3"]);
        });

        it("should return empty array for student with no applications", async () => {
            mockDb.query.mockResolvedValue({ rows: [] });
            const result = await mockDb.query(expect.any(String), ["student-2"]);
            expect(result.rows).toHaveLength(0);
        });
    });
});
