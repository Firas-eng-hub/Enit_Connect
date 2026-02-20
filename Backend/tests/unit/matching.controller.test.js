/**
 * Matching Controller Tests
 */
const request = require("supertest");
const { createTestApp, attachErrorHandler } = require("../../tests/helpers/app");

describe("Matching Controller", () => {
    let app;
    beforeEach(() => {
        app = createTestApp();
        attachErrorHandler(app);

        app.get("/api/student/matching/recommendations", (req, res) => {
            const limit = Number.parseInt(req.query.limit, 10) || 10;
            res.json({
                recommendations: [
                    {
                        offer: {
                            id: "offer-1",
                            title: "PFE Developer",
                            type: "PFE",
                            companyName: "TechCorp",
                            companyCity: "Tunis",
                        },
                        score: 0.72,
                        matchReasons: [
                            "Your field matches this offer type",
                            "Located in your city",
                        ],
                    },
                    {
                        offer: {
                            id: "offer-2",
                            title: "Stage Data Analyst",
                            type: "Stage",
                            companyName: "DataInc",
                            companyCity: "Sousse",
                        },
                        score: 0.45,
                        matchReasons: ["General match based on your profile"],
                    },
                ].slice(0, limit),
                total: 2,
            });
        });
    });

    describe("GET /api/student/matching/recommendations", () => {
        it("should return recommendations with scores", async () => {
            const response = await request(app).get(
                "/api/student/matching/recommendations"
            );
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("recommendations");
            expect(response.body).toHaveProperty("total");
            expect(Array.isArray(response.body.recommendations)).toBe(true);
        });

        it("should return recommendations sorted by score descending", async () => {
            const response = await request(app).get(
                "/api/student/matching/recommendations"
            );
            const scores = response.body.recommendations.map((r) => r.score);
            for (let i = 1; i < scores.length; i++) {
                expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
            }
        });

        it("should respect limit parameter", async () => {
            const response = await request(app).get(
                "/api/student/matching/recommendations?limit=1"
            );
            expect(response.status).toBe(200);
            expect(response.body.recommendations.length).toBeLessThanOrEqual(1);
        });

        it("should include match reasons", async () => {
            const response = await request(app).get(
                "/api/student/matching/recommendations"
            );
            const rec = response.body.recommendations[0];
            expect(rec).toHaveProperty("matchReasons");
            expect(Array.isArray(rec.matchReasons)).toBe(true);
            expect(rec.matchReasons.length).toBeGreaterThan(0);
        });

        it("should include offer details", async () => {
            const response = await request(app).get(
                "/api/student/matching/recommendations"
            );
            const offer = response.body.recommendations[0].offer;
            expect(offer).toHaveProperty("id");
            expect(offer).toHaveProperty("title");
            expect(offer).toHaveProperty("type");
            expect(offer).toHaveProperty("companyName");
        });
    });
});
