const {
    companyStatsRepository,
} = require("../repositories");

exports.getOverview = async (req, res) => {
    try {
        const overview = await companyStatsRepository.getOverview(req.id);
        res.status(200).send(overview);
    } catch (err) {
        console.error("[500]", req.method, req.originalUrl, err);
        res.status(500).send({ message: "Internal server error." });
    }
};

exports.getTrends = async (req, res) => {
    try {
        const days = Math.min(
            Math.max(Number.parseInt(req.query.days, 10) || 30, 1),
            90
        );
        const [viewTrendData, applicationTrendData] = await Promise.all([
            companyStatsRepository.viewTrend(req.id, days),
            companyStatsRepository.applicationTrend(req.id, days),
        ]);

        res.status(200).send({
            viewTrend: viewTrendData,
            applicationTrend: applicationTrendData,
        });
    } catch (err) {
        console.error("[500]", req.method, req.originalUrl, err);
        res.status(500).send({ message: "Internal server error." });
    }
};

exports.getConversions = async (req, res) => {
    try {
        const conversions = await companyStatsRepository.conversionRates(req.id);
        res.status(200).send(conversions);
    } catch (err) {
        console.error("[500]", req.method, req.originalUrl, err);
        res.status(500).send({ message: "Internal server error." });
    }
};

exports.getDemographics = async (req, res) => {
    try {
        const [demographics, statusBreakdown] = await Promise.all([
            companyStatsRepository.applicantDemographics(req.id),
            companyStatsRepository.candidacyStatusBreakdown(req.id),
        ]);

        res.status(200).send({
            ...demographics,
            statusBreakdown,
        });
    } catch (err) {
        console.error("[500]", req.method, req.originalUrl, err);
        res.status(500).send({ message: "Internal server error." });
    }
};
