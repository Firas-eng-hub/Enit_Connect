const db = require("../db");

const countStudents = async () => {
    const result = await db.query("SELECT COUNT(*) AS count FROM students");
    return Number(result.rows[0]?.count || 0);
};

const countCompanies = async () => {
    const result = await db.query("SELECT COUNT(*) AS count FROM companies");
    return Number(result.rows[0]?.count || 0);
};

const countOffers = async () => {
    const result = await db.query("SELECT COUNT(*) AS count FROM offers");
    return Number(result.rows[0]?.count || 0);
};

const countActiveOffers = async () => {
    const result = await db.query(
        "SELECT COUNT(*) AS count FROM offers WHERE end_date IS NULL OR end_date::date >= CURRENT_DATE"
    );
    return Number(result.rows[0]?.count || 0);
};

const countCandidacies = async () => {
    const result = await db.query("SELECT COUNT(*) AS count FROM offer_candidacies");
    return Number(result.rows[0]?.count || 0);
};

const studentRegistrationTrend = async (months = 6) => {
    const result = await db.query(
        `SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS count
     FROM students
     WHERE created_at >= NOW() - INTERVAL '1 month' * $1
     GROUP BY month
     ORDER BY month ASC`,
        [months]
    );
    return result.rows.map((row) => ({
        month: row.month,
        count: Number(row.count),
    }));
};

const companyRegistrationTrend = async (months = 6) => {
    const result = await db.query(
        `SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS count
     FROM companies
     WHERE created_at >= NOW() - INTERVAL '1 month' * $1
     GROUP BY month
     ORDER BY month ASC`,
        [months]
    );
    return result.rows.map((row) => ({
        month: row.month,
        count: Number(row.count),
    }));
};

const offerCreationTrend = async (months = 6) => {
    const result = await db.query(
        `SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS count
     FROM offers
     WHERE created_at >= NOW() - INTERVAL '1 month' * $1
     GROUP BY month
     ORDER BY month ASC`,
        [months]
    );
    return result.rows.map((row) => ({
        month: row.month,
        count: Number(row.count),
    }));
};

const candidacyStatusBreakdown = async () => {
    const result = await db.query(
        "SELECT COALESCE(status, 'pending') AS status, COUNT(*) AS count FROM offer_candidacies GROUP BY status"
    );
    return result.rows.map((row) => ({
        status: row.status,
        count: Number(row.count),
    }));
};

const offerTypeDistribution = async () => {
    const result = await db.query(
        "SELECT type, COUNT(*) AS count FROM offers GROUP BY type ORDER BY count DESC"
    );
    return result.rows.map((row) => ({
        type: row.type,
        count: Number(row.count),
    }));
};

const topCompaniesByOffers = async (limit = 10) => {
    const result = await db.query(
        `SELECT c.name, COUNT(o.id) AS offer_count
     FROM companies c
     JOIN offers o ON o.company_id = c.id
     GROUP BY c.id, c.name
     ORDER BY offer_count DESC
     LIMIT $1`,
        [limit]
    );
    return result.rows.map((row) => ({
        name: row.name,
        offerCount: Number(row.offer_count),
    }));
};

module.exports = {
    countStudents,
    countCompanies,
    countOffers,
    countActiveOffers,
    countCandidacies,
    studentRegistrationTrend,
    companyRegistrationTrend,
    offerCreationTrend,
    candidacyStatusBreakdown,
    offerTypeDistribution,
    topCompaniesByOffers,
};
