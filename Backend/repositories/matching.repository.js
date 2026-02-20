const db = require("../db");

const listActiveOffersWithCompany = async () => {
    const result = await db.query(
        `SELECT o.*,
            c.name  AS company_name,
            c.city  AS company_city,
            c.country AS company_country
     FROM offers o
     LEFT JOIN companies c ON c.id = o.company_id
     WHERE o.end_date IS NULL
        OR o.end_date >= CURRENT_DATE
     ORDER BY o.created_at DESC NULLS LAST`
    );
    return result.rows;
};

const listAppliedOfferIds = async (studentId) => {
    const result = await db.query(
        "SELECT DISTINCT offer_id FROM offer_candidacies WHERE student_id = $1",
        [studentId]
    );
    return result.rows.map((row) => row.offer_id);
};

module.exports = {
    listActiveOffersWithCompany,
    listAppliedOfferIds,
};
