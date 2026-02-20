const {
    statsRepository,
} = require("../repositories");

exports.getOverview = async (req, res) => {
    try {
        const [students, companies, offers, activeOffers, candidacies] =
            await Promise.all([
                statsRepository.countStudents(),
                statsRepository.countCompanies(),
                statsRepository.countOffers(),
                statsRepository.countActiveOffers(),
                statsRepository.countCandidacies(),
            ]);

        res.status(200).send({
            students,
            companies,
            offers,
            activeOffers,
            candidacies,
        });
    } catch (err) {
        res.status(500).send({ message: err.message || err });
    }
};

exports.getTrends = async (req, res) => {
    try {
        const months = Math.min(
            Math.max(Number.parseInt(req.query.months, 10) || 6, 1),
            24
        );

        const [
            registrationTrend,
            companyTrend,
            offerTrend,
            statusBreakdown,
            typeDistribution,
            topCompanies,
        ] = await Promise.all([
            statsRepository.studentRegistrationTrend(months),
            statsRepository.companyRegistrationTrend(months),
            statsRepository.offerCreationTrend(months),
            statsRepository.candidacyStatusBreakdown(),
            statsRepository.offerTypeDistribution(),
            statsRepository.topCompaniesByOffers(10),
        ]);

        res.status(200).send({
            registrationTrend,
            companyTrend,
            offerTrend,
            statusBreakdown,
            typeDistribution,
            topCompanies,
        });
    } catch (err) {
        res.status(500).send({ message: err.message || err });
    }
};
