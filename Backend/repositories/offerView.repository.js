const db = require("../db");

const recordView = async (offerId, viewerId = null, viewerType = null) => {
    await db.query(
        `INSERT INTO offer_views (offer_id, viewer_id, viewer_type)
     VALUES ($1, $2, $3)`,
        [offerId, viewerId, viewerType]
    );
};

const countByOffer = async (offerId) => {
    const result = await db.query(
        "SELECT COUNT(*) AS count FROM offer_views WHERE offer_id = $1",
        [offerId]
    );
    return Number(result.rows[0]?.count || 0);
};

module.exports = {
    recordView,
    countByOffer,
};
