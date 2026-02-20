jest.mock("../../db", () => ({
    query: jest.fn(),
}));

const db = require("../../db");
const companyStatsRepository = require("../../repositories/companyStats.repository");

describe("CompanyStats Repository", () => {
    afterEach(() => jest.clearAllMocks());

    describe("getOverview", () => {
        it("should return aggregate counts", async () => {
            db.query.mockResolvedValueOnce({
                rows: [{
                    total_offers: "12",
                    active_offers: "5",
                    total_candidacies: "30",
                    total_views: "150",
                }],
            });
            const result = await companyStatsRepository.getOverview("c1");
            expect(result.totalOffers).toBe(12);
            expect(result.activeOffers).toBe(5);
            expect(result.totalCandidacies).toBe(30);
            expect(result.totalViews).toBe(150);
        });
    });

    describe("viewTrend", () => {
        it("should return daily view counts", async () => {
            db.query.mockResolvedValueOnce({
                rows: [
                    { day: "2025-01-01", views: "10" },
                    { day: "2025-01-02", views: "15" },
                ],
            });
            const result = await companyStatsRepository.viewTrend("c1", 30);
            expect(result).toHaveLength(2);
            expect(result[0].views).toBe(10);
        });
    });

    describe("conversionRates", () => {
        it("should return per-offer conversion data", async () => {
            db.query.mockResolvedValueOnce({
                rows: [{
                    id: "o1", title: "Dev Role", type: "PFE",
                    created_at: new Date(),
                    views: "100", applications: "25", conversion_rate: "25.0",
                }],
            });
            const result = await companyStatsRepository.conversionRates("c1");
            expect(result[0].conversionRate).toBe(25);
            expect(result[0].views).toBe(100);
        });
    });

    describe("applicantDemographics", () => {
        it("should return demographics breakdown", async () => {
            db.query
                .mockResolvedValueOnce({ rows: [{ type: "Engineer", count: "10" }] })
                .mockResolvedValueOnce({ rows: [{ city: "Tunis", count: "8" }] })
                .mockResolvedValueOnce({ rows: [{ promotion: "2025", count: "5" }] });

            const result = await companyStatsRepository.applicantDemographics("c1");
            expect(result.byType[0].type).toBe("Engineer");
            expect(result.byCity[0].city).toBe("Tunis");
            expect(result.byPromotion[0].promotion).toBe("2025");
        });
    });

    describe("candidacyStatusBreakdown", () => {
        it("should return status counts", async () => {
            db.query.mockResolvedValueOnce({
                rows: [
                    { status: "pending", count: "20" },
                    { status: "accepted", count: "10" },
                ],
            });
            const result = await companyStatsRepository.candidacyStatusBreakdown("c1");
            expect(result).toHaveLength(2);
            expect(result[0].status).toBe("pending");
        });
    });
});
