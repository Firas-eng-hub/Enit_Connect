jest.mock("../../db", () => ({
    query: jest.fn(),
}));

const db = require("../../db");

describe("OfferView Repository", () => {
    afterEach(() => jest.clearAllMocks());

    const offerViewRepository = require("../../repositories/offerView.repository");

    describe("recordView", () => {
        it("should insert a view record", async () => {
            db.query.mockResolvedValueOnce({});
            await offerViewRepository.recordView("offer-1", "user-1", "student");
            expect(db.query).toHaveBeenCalledTimes(1);
            expect(db.query.mock.calls[0][1]).toEqual(["offer-1", "user-1", "student"]);
        });

        it("should handle null viewer", async () => {
            db.query.mockResolvedValueOnce({});
            await offerViewRepository.recordView("offer-1");
            expect(db.query.mock.calls[0][1]).toEqual(["offer-1", null, null]);
        });
    });

    describe("countByOffer", () => {
        it("should return view count", async () => {
            db.query.mockResolvedValueOnce({ rows: [{ count: "42" }] });
            const count = await offerViewRepository.countByOffer("offer-1");
            expect(count).toBe(42);
        });

        it("should return 0 when no views", async () => {
            db.query.mockResolvedValueOnce({ rows: [{ count: "0" }] });
            const count = await offerViewRepository.countByOffer("offer-1");
            expect(count).toBe(0);
        });
    });
});
