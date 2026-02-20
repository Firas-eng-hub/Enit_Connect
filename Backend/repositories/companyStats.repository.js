const db = require("../db");

const getOverview = async (companyId) => {
    const result = await db.query(
        `SELECT
       (SELECT COUNT(*) FROM offers WHERE company_id = $1) AS total_offers,
       (SELECT COUNT(*) FROM offers WHERE company_id = $1 AND (end_date IS NULL OR end_date::date >= CURRENT_DATE)) AS active_offers,
       (SELECT COUNT(*) FROM offer_candidacies oc JOIN offers o ON o.id = oc.offer_id WHERE o.company_id = $1) AS total_candidacies,
       (SELECT COUNT(*) FROM offer_views ov JOIN offers o ON o.id = ov.offer_id WHERE o.company_id = $1) AS total_views`,
        [companyId]
    );
    const row = result.rows[0] || {};
    return {
        totalOffers: Number(row.total_offers || 0),
        activeOffers: Number(row.active_offers || 0),
        totalCandidacies: Number(row.total_candidacies || 0),
        totalViews: Number(row.total_views || 0),
    };
};

const viewTrend = async (companyId, days = 30) => {
    const result = await db.query(
        `SELECT DATE_TRUNC('day', ov.viewed_at) AS day, COUNT(*) AS views
     FROM offer_views ov
     JOIN offers o ON o.id = ov.offer_id
     WHERE o.company_id = $1 AND ov.viewed_at >= NOW() - INTERVAL '1 day' * $2
     GROUP BY day
     ORDER BY day ASC`,
        [companyId, days]
    );
    return result.rows.map((row) => ({ day: row.day, views: Number(row.views) }));
};

const applicationTrend = async (companyId, days = 30) => {
    const result = await db.query(
        `SELECT DATE_TRUNC('day', oc.created_at) AS day, COUNT(*) AS applications
     FROM offer_candidacies oc
     JOIN offers o ON o.id = oc.offer_id
     WHERE o.company_id = $1 AND oc.created_at >= NOW() - INTERVAL '1 day' * $2
     GROUP BY day
     ORDER BY day ASC`,
        [companyId, days]
    );
    return result.rows.map((row) => ({ day: row.day, applications: Number(row.applications) }));
};

const conversionRates = async (companyId) => {
    const result = await db.query(
        `SELECT o.id, o.title, o.type, o.created_at,
       COUNT(DISTINCT ov.id) AS views,
       COUNT(DISTINCT oc.id) AS applications,
       CASE WHEN COUNT(DISTINCT ov.id) > 0
         THEN ROUND(COUNT(DISTINCT oc.id)::numeric / COUNT(DISTINCT ov.id) * 100, 1)
         ELSE 0 END AS conversion_rate
     FROM offers o
     LEFT JOIN offer_views ov ON ov.offer_id = o.id
     LEFT JOIN offer_candidacies oc ON oc.offer_id = o.id
     WHERE o.company_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
        [companyId]
    );
    return result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        type: row.type,
        createdAt: row.created_at,
        views: Number(row.views),
        applications: Number(row.applications),
        conversionRate: Number(row.conversion_rate),
    }));
};

const applicantDemographics = async (companyId) => {
    const byType = await db.query(
        `SELECT s.type, COUNT(*) AS count
     FROM offer_candidacies oc
     JOIN offers o ON o.id = oc.offer_id
     JOIN students s ON s.id = oc.student_id
     WHERE o.company_id = $1 AND s.type IS NOT NULL
     GROUP BY s.type ORDER BY count DESC`,
        [companyId]
    );

    const byCity = await db.query(
        `SELECT s.city, COUNT(*) AS count
     FROM offer_candidacies oc
     JOIN offers o ON o.id = oc.offer_id
     JOIN students s ON s.id = oc.student_id
     WHERE o.company_id = $1 AND s.city IS NOT NULL
     GROUP BY s.city ORDER BY count DESC LIMIT 10`,
        [companyId]
    );

    const byPromotion = await db.query(
        `SELECT s.promotion, COUNT(*) AS count
     FROM offer_candidacies oc
     JOIN offers o ON o.id = oc.offer_id
     JOIN students s ON s.id = oc.student_id
     WHERE o.company_id = $1 AND s.promotion IS NOT NULL
     GROUP BY s.promotion ORDER BY count DESC`,
        [companyId]
    );

    return {
        byType: byType.rows.map((r) => ({ type: r.type, count: Number(r.count) })),
        byCity: byCity.rows.map((r) => ({ city: r.city, count: Number(r.count) })),
        byPromotion: byPromotion.rows.map((r) => ({ promotion: r.promotion, count: Number(r.count) })),
    };
};

const candidacyStatusBreakdown = async (companyId) => {
    const result = await db.query(
        `SELECT COALESCE(oc.status, 'pending') AS status, COUNT(*) AS count
     FROM offer_candidacies oc
     JOIN offers o ON o.id = oc.offer_id
     WHERE o.company_id = $1
     GROUP BY oc.status`,
        [companyId]
    );
    return result.rows.map((r) => ({ status: r.status, count: Number(r.count) }));
};

module.exports = {
    getOverview,
    viewTrend,
    applicationTrend,
    conversionRates,
    applicantDemographics,
    candidacyStatusBreakdown,
};
