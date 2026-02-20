const stringSimilarity = require("string-similarity");
const { studentRepository, matchingRepository } = require("../repositories");
const { isUuid } = require("../utils/validation");

// Scoring weights (tunable)
const WEIGHTS = {
    type: 0.35,
    content: 0.25,
    classField: 0.20,
    location: 0.10,
    recency: 0.10,
};

const MAX_RECENCY_DAYS = 30;

function safe(value) {
    return (value || "").toString().toLowerCase().trim();
}

function recencyScore(createdAt) {
    if (!createdAt) return 0;
    const ageMs = Date.now() - new Date(createdAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays <= 0) return 1;
    if (ageDays >= MAX_RECENCY_DAYS) return 0;
    return 1 - ageDays / MAX_RECENCY_DAYS;
}

function compare(a, b) {
    const sa = safe(a);
    const sb = safe(b);
    if (!sa || !sb) return 0;
    return stringSimilarity.compareTwoStrings(sa, sb);
}

function buildMatchReasons(scores) {
    const reasons = [];
    if (scores.type > 0.4) reasons.push("Your field matches this offer type");
    if (scores.content > 0.3) reasons.push("Your profile aligns with the offer description");
    if (scores.classField > 0.3) reasons.push("Your class/specialty relates to this offer");
    if (scores.location > 0.5) reasons.push("Located in your city");
    if (scores.recency > 0.7) reasons.push("Recently posted");
    if (reasons.length === 0) reasons.push("General match based on your profile");
    return reasons;
}

exports.getRecommendations = async (req, res) => {
    try {
        if (!isUuid(req.id)) {
            return res.status(401).send({ message: "Unauthorized!" });
        }

        const limit = Math.min(
            Math.max(Number.parseInt(req.query.limit, 10) || 10, 1),
            50
        );

        const student = await studentRepository.findById(req.id);
        if (!student) {
            return res.status(404).send({ message: "Student not found." });
        }

        const [offers, appliedIds] = await Promise.all([
            matchingRepository.listActiveOffersWithCompany(),
            matchingRepository.listAppliedOfferIds(req.id),
        ]);

        const appliedSet = new Set(appliedIds);

        const scored = offers
            .filter((offer) => !appliedSet.has(offer.id))
            .map((offer) => {
                const scores = {
                    type: compare(student.type, offer.type),
                    content: compare(student.aboutme, offer.content),
                    classField: compare(student.class, offer.title),
                    location: compare(student.city, offer.company_city),
                    recency: recencyScore(offer.created_at),
                };

                const total =
                    scores.type * WEIGHTS.type +
                    scores.content * WEIGHTS.content +
                    scores.classField * WEIGHTS.classField +
                    scores.location * WEIGHTS.location +
                    scores.recency * WEIGHTS.recency;

                return {
                    offer: {
                        id: offer.id,
                        title: offer.title,
                        type: offer.type,
                        content: offer.content,
                        start: offer.start_date,
                        end: offer.end_date,
                        createdAt: offer.created_at,
                        companyId: offer.company_id,
                        companyName: offer.company_name,
                        companyCity: offer.company_city,
                        companyCountry: offer.company_country,
                    },
                    score: Math.round(total * 100) / 100,
                    matchReasons: buildMatchReasons(scores),
                };
            });

        scored.sort((a, b) => b.score - a.score);

        res.status(200).send({
            recommendations: scored.slice(0, limit),
            total: scored.length,
        });
    } catch (err) {
        res.status(500).send({ message: err.message || err });
    }
};
