jest.mock("../../db", () => ({
    query: jest.fn(),
}));

const db = require("../../db");
const offerRepository = require("../../repositories/offer.repository");

describe("Offer Repository - searchAdvanced", () => {
    afterEach(() => jest.clearAllMocks());

    it("should search with no filters and return all offers", async () => {
        db.query
            .mockResolvedValueOnce({ rows: [{ total: "5" }] })
            .mockResolvedValueOnce({ rows: [{ id: "1", title: "Test", type: "PFE" }] });

        const result = await offerRepository.searchAdvanced({});
        expect(result.totalCount).toBe(5);
        expect(result.rows).toHaveLength(1);
        expect(db.query).toHaveBeenCalledTimes(2);
    });

    it("should apply text query filter", async () => {
        db.query
            .mockResolvedValueOnce({ rows: [{ total: "2" }] })
            .mockResolvedValueOnce({ rows: [] });

        await offerRepository.searchAdvanced({ q: "developer" });
        const countCall = db.query.mock.calls[0];
        expect(countCall[0]).toContain("title ILIKE");
        expect(countCall[1]).toContain("%developer%");
    });

    it("should apply type filter (single)", async () => {
        db.query
            .mockResolvedValueOnce({ rows: [{ total: "1" }] })
            .mockResolvedValueOnce({ rows: [] });

        await offerRepository.searchAdvanced({ type: "PFE" });
        const countCall = db.query.mock.calls[0];
        expect(countCall[0]).toContain("type = $");
        expect(countCall[1]).toContain("PFE");
    });

    it("should apply type filter (array)", async () => {
        db.query
            .mockResolvedValueOnce({ rows: [{ total: "3" }] })
            .mockResolvedValueOnce({ rows: [] });

        await offerRepository.searchAdvanced({ type: ["PFE", "PFA"] });
        const countCall = db.query.mock.calls[0];
        expect(countCall[0]).toContain("ANY");
    });

    it("should apply date range filters", async () => {
        db.query
            .mockResolvedValueOnce({ rows: [{ total: "1" }] })
            .mockResolvedValueOnce({ rows: [] });

        await offerRepository.searchAdvanced({ dateFrom: "2025-01-01", dateTo: "2025-12-31" });
        const countCall = db.query.mock.calls[0];
        expect(countCall[0]).toContain("created_at >=");
        expect(countCall[0]).toContain("created_at <=");
    });

    it("should apply active filter", async () => {
        db.query
            .mockResolvedValueOnce({ rows: [{ total: "1" }] })
            .mockResolvedValueOnce({ rows: [] });

        await offerRepository.searchAdvanced({ active: true });
        const countCall = db.query.mock.calls[0];
        expect(countCall[0]).toContain("end_date IS NULL OR end_date >= CURRENT_DATE");
    });

    it("should apply pagination", async () => {
        db.query
            .mockResolvedValueOnce({ rows: [{ total: "50" }] })
            .mockResolvedValueOnce({ rows: [] });

        await offerRepository.searchAdvanced({ limit: 10, offset: 20 });
        const dataCall = db.query.mock.calls[1];
        expect(dataCall[0]).toContain("LIMIT");
        expect(dataCall[0]).toContain("OFFSET");
        expect(dataCall[1]).toContain(10);
        expect(dataCall[1]).toContain(20);
    });
});
