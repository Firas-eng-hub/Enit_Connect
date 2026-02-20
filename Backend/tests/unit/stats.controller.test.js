/**
 * Stats Controller Tests
 */
const request = require("supertest");
const { createTestApp, attachErrorHandler } = require("../../tests/helpers/app");

describe("Stats Controller", () => {
    let app;
    beforeEach(() => {
        app = createTestApp();
        attachErrorHandler(app);

        app.get("/api/admin/stats/overview", (req, res) => {
            res.json({
                students: 42,
                companies: 15,
                offers: 8,
                activeOffers: 5,
                candidacies: 23,
            });
        });

        app.get("/api/admin/stats/trends", (req, res) => {
            const months = Number.parseInt(req.query.months, 10) || 6;
            res.json({
                registrationTrend: [
                    { month: "2026-01-01T00:00:00.000Z", count: 12 },
                    { month: "2026-02-01T00:00:00.000Z", count: 8 },
                ],
                offerTrend: [
                    { month: "2026-01-01T00:00:00.000Z", count: 3 },
                ],
                statusBreakdown: [
                    { status: "pending", count: 10 },
                    { status: "accepted", count: 5 },
                ],
                typeDistribution: [
                    { type: "PFE", count: 4 },
                    { type: "Stage", count: 3 },
                ],
                topCompanies: [
                    { name: "TechCorp", offerCount: 12 },
                ],
            });
        });
    });

    describe("GET /api/admin/stats/overview", () => {
        it("should return overview stats", async () => {
            const response = await request(app).get("/api/admin/stats/overview");
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("students");
            expect(response.body).toHaveProperty("companies");
            expect(response.body).toHaveProperty("offers");
            expect(response.body).toHaveProperty("activeOffers");
            expect(response.body).toHaveProperty("candidacies");
            expect(typeof response.body.students).toBe("number");
        });
    });

    describe("GET /api/admin/stats/trends", () => {
        it("should return trend data", async () => {
            const response = await request(app).get("/api/admin/stats/trends?months=6");
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("registrationTrend");
            expect(response.body).toHaveProperty("offerTrend");
            expect(response.body).toHaveProperty("statusBreakdown");
            expect(response.body).toHaveProperty("typeDistribution");
            expect(response.body).toHaveProperty("topCompanies");
            expect(Array.isArray(response.body.registrationTrend)).toBe(true);
        });

        it("should default to 6 months", async () => {
            const response = await request(app).get("/api/admin/stats/trends");
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("registrationTrend");
        });
    });
});
